import type { Timestamp } from "firebase/firestore";
import type { AnyDate } from "@/utils/date";

export interface DayBase {
  date: AnyDate;
  title?: string;
  summary?: string;
  notes?: string;
  order: number;
}

export interface DayDoc extends DayBase {
  id: string;
  tripId: string;
  createdAt: Timestamp | Date | string;
  updatedAt: Timestamp | Date | string;
}

export type DayFormData = DayBase;
