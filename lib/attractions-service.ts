import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp,
  type QueryConstraint,
} from "firebase/firestore";
import { firestore } from "./firebase";
import type {
  AttractionDoc,
  AttractionFormData,
} from "@/types/attraction";
import type { Photo } from "@/types/photo";
import type { Video } from "@/types/video";
import { fromInputDate, toDate } from "@/utils/date";
import { deleteFromStorage } from "./storage-service";

const TRIPS = "trips";
const ATTRACTIONS = "attractions";

function col(tripId: string) {
  return collection(firestore, TRIPS, tripId, ATTRACTIONS);
}

function attrDoc(tripId: string, attractionId: string) {
  return doc(firestore, TRIPS, tripId, ATTRACTIONS, attractionId);
}

function toTimestamp(value: unknown): Timestamp | null {
  if (value == null || value === "") return null;
  if (value instanceof Timestamp) return value;
  if (typeof value === "string") {
    const parsed = fromInputDate(value) || toDate(value);
    return parsed ? Timestamp.fromDate(parsed) : null;
  }
  const date = toDate(value as never);
  return date ? Timestamp.fromDate(date) : null;
}

function sanitize(data: AttractionFormData) {
  return {
    dayId: data.dayId || "",
    title: data.title?.trim() || "",
    type: data.type,
    visitDate: toTimestamp(data.visitDate),
    description: data.description || "",
    notes: data.notes || "",
    locationName: data.locationName || "",
    googleMapsUrl: data.googleMapsUrl || "",
    approximateCost: Number(data.approximateCost) || 0,
    currency: data.currency || "BRL",
    difficulty: data.difficulty || "nenhuma",
    rating: Number(data.rating) || 0,
    visitTime: data.visitTime || "",
    timeSpent: data.timeSpent || "",
    requiresGuide: !!data.requiresGuide,
    distanceOrTransfer: data.distanceOrTransfer || "",
    bestTimeToVisit: data.bestTimeToVisit || "",
    whatToBring: data.whatToBring || "",
    wouldRecommend: !!data.wouldRecommend,
    physicalEffortLevel: data.physicalEffortLevel || "nenhuma",
    risksOrWarnings: data.risksOrWarnings || "",
    coverImageUrl: data.coverImageUrl || "",
    coverImagePath: data.coverImagePath || "",
    photos: (data.photos || []) as Photo[],
    videos: (data.videos || []) as Video[],
    order: Number(data.order) || 0,
  };
}

export async function createAttraction(
  tripId: string,
  data: AttractionFormData,
): Promise<string> {
  const ref = await addDoc(col(tripId), {
    ...sanitize(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateAttraction(
  tripId: string,
  attractionId: string,
  data: AttractionFormData,
): Promise<void> {
  await updateDoc(attrDoc(tripId, attractionId), {
    ...sanitize(data),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteAttraction(
  tripId: string,
  attractionId: string,
): Promise<void> {
  // Cleanup das imagens primeiro (best-effort), depois o documento
  try {
    const snap = await getDoc(attrDoc(tripId, attractionId));
    if (snap.exists()) {
      const data = snap.data() as AttractionDoc;
      const paths = [
        data.coverImagePath,
        ...(data.photos || []).map((p) => p.storagePath),
        ...(data.videos || []).map((v) => v.storagePath),
      ].filter((p): p is string => !!p);
      await Promise.allSettled(paths.map((p) => deleteFromStorage(p)));
    }
  } catch {
    // ignora cleanup falho
  }
  await deleteDoc(attrDoc(tripId, attractionId));
}

export interface ListAttractionsFilters {
  dayId?: string;
}

export async function listAttractions(
  tripId: string,
  filters: ListAttractionsFilters = {},
): Promise<AttractionDoc[]> {
  const constraints: QueryConstraint[] = [];
  if (filters.dayId) constraints.push(where("dayId", "==", filters.dayId));
  constraints.push(orderBy("order", "asc"));
  const snap = await getDocs(query(col(tripId), ...constraints));
  return snap.docs.map(
    (d) =>
      ({
        id: d.id,
        tripId,
        ...(d.data() as Omit<AttractionDoc, "id" | "tripId">),
      }),
  );
}

export async function getAttraction(
  tripId: string,
  attractionId: string,
): Promise<AttractionDoc | null> {
  const snap = await getDoc(attrDoc(tripId, attractionId));
  if (!snap.exists()) return null;
  return {
    id: snap.id,
    tripId,
    ...(snap.data() as Omit<AttractionDoc, "id" | "tripId">),
  };
}

export async function updateAttractionCover(
  tripId: string,
  attractionId: string,
  coverImageUrl: string,
  coverImagePath: string,
): Promise<void> {
  await updateDoc(attrDoc(tripId, attractionId), {
    coverImageUrl,
    coverImagePath,
    updatedAt: serverTimestamp(),
  });
}

export async function setAttractionPhotos(
  tripId: string,
  attractionId: string,
  photos: Photo[],
): Promise<void> {
  await updateDoc(attrDoc(tripId, attractionId), {
    photos,
    updatedAt: serverTimestamp(),
  });
}

export async function setAttractionVideos(
  tripId: string,
  attractionId: string,
  videos: Video[],
): Promise<void> {
  await updateDoc(attrDoc(tripId, attractionId), {
    videos,
    updatedAt: serverTimestamp(),
  });
}
