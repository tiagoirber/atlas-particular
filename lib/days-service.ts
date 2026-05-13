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
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { firestore } from "./firebase";
import type { DayDoc, DayFormData } from "@/types/day";
import { fromInputDate, toDate } from "@/utils/date";

const TRIPS = "trips";
const DAYS = "days";

function daysCol(tripId: string) {
  return collection(firestore, TRIPS, tripId, DAYS);
}

function daysDoc(tripId: string, dayId: string) {
  return doc(firestore, TRIPS, tripId, DAYS, dayId);
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

function sanitize(data: DayFormData) {
  return {
    date: toTimestamp(data.date),
    title: data.title?.trim() || "",
    summary: data.summary || "",
    notes: data.notes || "",
    order: Number(data.order) || 0,
  };
}

export async function createDay(
  tripId: string,
  data: DayFormData,
): Promise<string> {
  const payload = sanitize(data);
  const ref = await addDoc(daysCol(tripId), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateDay(
  tripId: string,
  dayId: string,
  data: DayFormData,
): Promise<void> {
  const payload = sanitize(data);
  await updateDoc(daysDoc(tripId, dayId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDay(tripId: string, dayId: string): Promise<void> {
  await deleteDoc(daysDoc(tripId, dayId));
}

export async function listDays(tripId: string): Promise<DayDoc[]> {
  const snap = await getDocs(query(daysCol(tripId), orderBy("order", "asc")));
  return snap.docs.map(
    (d) => ({ id: d.id, tripId, ...(d.data() as Omit<DayDoc, "id" | "tripId">) }),
  );
}

export async function getDay(
  tripId: string,
  dayId: string,
): Promise<DayDoc | null> {
  const snap = await getDoc(daysDoc(tripId, dayId));
  if (!snap.exists()) return null;
  return { id: snap.id, tripId, ...(snap.data() as Omit<DayDoc, "id" | "tripId">) };
}
