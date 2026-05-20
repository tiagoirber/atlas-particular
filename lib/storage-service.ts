import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
} from "firebase/storage";
import { Timestamp } from "firebase/firestore";
import { storage } from "./firebase";
import type { ImageRef, Photo } from "@/types/photo";
import type { Video } from "@/types/video";
import { validateImageFile, validateVideoFile } from "@/utils/validators";

function sanitizeFileName(name: string): string {
  const lastDot = name.lastIndexOf(".");
  const ext = lastDot >= 0 ? name.slice(lastDot).toLowerCase() : "";
  const base = (lastDot >= 0 ? name.slice(0, lastDot) : name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const stamp = Date.now().toString(36);
  return `${stamp}-${base || "img"}${ext}`;
}

export async function uploadImage(
  file: File,
  path: string,
): Promise<ImageRef> {
  const check = validateImageFile(file);
  if (!check.ok) throw new Error(check.reason);

  const filename = sanitizeFileName(file.name);
  const storagePath = `${path}/${filename}`;
  const objectRef = ref(storage, storagePath);
  await uploadBytes(objectRef, file, { contentType: file.type });
  const url = await getDownloadURL(objectRef);
  return { url, storagePath };
}

export async function uploadTripCover(
  tripId: string,
  file: File,
): Promise<ImageRef> {
  return uploadImage(file, `trips/${tripId}/cover`);
}

export async function uploadAttractionCover(
  tripId: string,
  attractionId: string,
  file: File,
): Promise<ImageRef> {
  return uploadImage(
    file,
    `trips/${tripId}/attractions/${attractionId}/cover`,
  );
}

export async function uploadAttractionPhoto(
  tripId: string,
  attractionId: string,
  file: File,
): Promise<Photo> {
  const { url, storagePath } = await uploadImage(
    file,
    `trips/${tripId}/attractions/${attractionId}/photos`,
  );
  return {
    url,
    storagePath,
    caption: "",
    order: 0,
    uploadedAt: Timestamp.now(),
  };
}

export async function uploadAttractionVideo(
  tripId: string,
  attractionId: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<Video> {
  const check = validateVideoFile(file);
  if (!check.ok) throw new Error(check.reason);

  const filename = sanitizeFileName(file.name);
  const storagePath = `trips/${tripId}/attractions/${attractionId}/videos/${filename}`;
  const objectRef = ref(storage, storagePath);

  await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(objectRef, file, { contentType: file.type });
    task.on(
      "state_changed",
      (snap) => {
        if (onProgress) {
          onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
        }
      },
      reject,
      resolve,
    );
  });

  const url = await getDownloadURL(objectRef);
  return { url, storagePath, caption: "", order: 0, uploadedAt: Timestamp.now() };
}

export async function deleteFromStorage(storagePath: string): Promise<void> {
  if (!storagePath) return;
  try {
    await deleteObject(ref(storage, storagePath));
  } catch (err) {
    // Já pode ter sido removida; não bloquear.
    console.warn(`[storage] falha ao excluir ${storagePath}`, err);
  }
}

async function deleteFolderRecursive(folderPath: string): Promise<void> {
  try {
    const folder = ref(storage, folderPath);
    const listing = await listAll(folder);
    await Promise.allSettled(listing.items.map((item) => deleteObject(item)));
    await Promise.allSettled(
      listing.prefixes.map((p) => deleteFolderRecursive(p.fullPath)),
    );
  } catch (err) {
    console.warn(`[storage] falha ao limpar pasta ${folderPath}`, err);
  }
}

export async function deleteTripStorage(tripId: string): Promise<void> {
  await deleteFolderRecursive(`trips/${tripId}`);
}

export async function deleteAttractionStorage(
  tripId: string,
  attractionId: string,
): Promise<void> {
  await deleteFolderRecursive(`trips/${tripId}/attractions/${attractionId}`);
}
