import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  type QueryConstraint,
} from "firebase/firestore";
import { firestore } from "./firebase";
import type { TripDoc, TripFormData, TripStatus } from "@/types/trip";
import { fromInputDate, toDate } from "@/utils/date";
import { slugify } from "@/utils/format";
import { deleteTripStorage } from "./storage-service";
import { listDays, deleteDay } from "./days-service";
import { listAttractions, deleteAttraction } from "./attractions-service";

const TRIPS = "trips";

function buildSearchKeywords(data: Partial<TripFormData>): string[] {
  const keywords = new Set<string>();
  const push = (text?: string) => {
    if (!text) return;
    const lower = text.toLowerCase();
    keywords.add(lower);
    lower.split(/\s+/).forEach((token) => {
      if (token.length >= 3) keywords.add(token);
    });
  };
  push(data.title);
  push(data.destination);
  push(data.country);
  push(data.state);
  push(data.city);
  data.tags?.forEach(push);
  return Array.from(keywords);
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

function sanitizeTripPayload(data: TripFormData) {
  const startDate = toTimestamp(data.startDate);
  const endDate = toTimestamp(data.endDate);
  return {
    title: data.title?.trim() || "",
    destination: data.destination?.trim() || "",
    country: data.country?.trim() || "",
    state: data.state?.trim() || "",
    city: data.city?.trim() || "",
    startDate,
    endDate,
    generalDescription: data.generalDescription || "",
    notes: data.notes || "",
    mood: data.mood || "",
    bestMoment: data.bestMoment || "",
    worstMoment: data.worstMoment || "",
    coverImageUrl: data.coverImageUrl || "",
    coverImagePath: data.coverImagePath || "",
    approximateTotalCost: Number(data.approximateTotalCost) || 0,
    currency: data.currency || "BRL",
    generalRating: Number(data.generalRating) || 0,
    wouldReturn: !!data.wouldReturn,
    wouldReturnNote: data.wouldReturnNote || "",
    travelers: Number(data.travelers) || 0,
    travelerNames: data.travelerNames || [],
    tags: data.tags || [],
    status: (data.status || "draft") as TripStatus,
    isPublic: !!data.isPublic,
  };
}

function tripFromSnapshot(id: string, raw: Record<string, unknown>): TripDoc {
  return { id, ...(raw as Omit<TripDoc, "id">) };
}

export async function createTrip(
  userId: string,
  data: TripFormData,
): Promise<string> {
  const payload = sanitizeTripPayload(data);
  const docRef = await addDoc(collection(firestore, TRIPS), {
    ...payload,
    slug: slugify(payload.title),
    searchKeywords: buildSearchKeywords(payload),
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateTrip(
  tripId: string,
  data: TripFormData,
): Promise<void> {
  const payload = sanitizeTripPayload(data);
  await updateDoc(doc(firestore, TRIPS, tripId), {
    ...payload,
    slug: slugify(payload.title),
    searchKeywords: buildSearchKeywords(payload),
    updatedAt: serverTimestamp(),
  });
}

function logRejected(context: string, results: PromiseSettledResult<unknown>[]) {
  results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .forEach((r) => console.error(`[deleteTrip] falha em ${context}:`, r.reason));
}

export async function deleteTrip(tripId: string): Promise<void> {
  // Best-effort cascade: subcoleções e arquivos. Falhas individuais não bloqueiam
  // a exclusão do documento principal, mas ficam registradas no console.
  try {
    const [days, attractions] = await Promise.all([
      listDays(tripId),
      listAttractions(tripId),
    ]);
    const results = await Promise.allSettled([
      ...days.map((d) => deleteDay(tripId, d.id)),
      ...attractions.map((a) => deleteAttraction(tripId, a.id)),
    ]);
    logRejected(`subcoleções da viagem ${tripId}`, results);
  } catch (err) {
    console.error(`[deleteTrip] falha ao listar subcoleções da viagem ${tripId}:`, err);
  }
  const storageResults = await Promise.allSettled([deleteTripStorage(tripId)]);
  logRejected(`storage da viagem ${tripId}`, storageResults);
  await deleteDoc(doc(firestore, TRIPS, tripId));
}

export interface ListTripsFilters {
  status?: TripStatus;
  publicOnly?: boolean;
}

export async function listTrips(
  filters: ListTripsFilters = {},
): Promise<TripDoc[]> {
  const constraints: QueryConstraint[] = [];
  if (filters.status) constraints.push(where("status", "==", filters.status));
  if (filters.publicOnly) constraints.push(where("isPublic", "==", true));
  constraints.push(orderBy("startDate", "desc"));

  const snap = await getDocs(query(collection(firestore, TRIPS), ...constraints));
  return snap.docs.map((d) => tripFromSnapshot(d.id, d.data()));
}

export async function listPublishedTrips(): Promise<TripDoc[]> {
  return listTrips({ status: "published", publicOnly: true });
}

export async function getTrip(tripId: string): Promise<TripDoc | null> {
  const snap = await getDoc(doc(firestore, TRIPS, tripId));
  if (!snap.exists()) return null;
  return tripFromSnapshot(snap.id, snap.data());
}

export async function searchTrips(term: string): Promise<TripDoc[]> {
  const trimmed = term.trim().toLowerCase();
  if (!trimmed) return listTrips();
  const all = await listTrips();
  return all.filter((trip) => {
    if (trip.title?.toLowerCase().includes(trimmed)) return true;
    if (trip.destination?.toLowerCase().includes(trimmed)) return true;
    if (trip.country?.toLowerCase().includes(trimmed)) return true;
    if (trip.city?.toLowerCase().includes(trimmed)) return true;
    if (trip.searchKeywords?.some((k) => k.includes(trimmed))) return true;
    return false;
  });
}
