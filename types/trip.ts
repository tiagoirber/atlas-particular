import type { Timestamp } from "firebase/firestore";
import type { AnyDate } from "@/utils/date";

export type TripStatus = "draft" | "published";

export interface TripBase {
  title: string;
  destination: string;
  country: string;
  state?: string;
  city?: string;
  startDate: AnyDate;
  endDate: AnyDate;
  generalDescription?: string;
  notes?: string;
  mood?: string;
  bestMoment?: string;
  worstMoment?: string;
  coverImageUrl?: string;
  coverImagePath?: string;
  approximateTotalCost?: number;
  currency?: string;
  generalRating?: number; // 1..5
  wouldReturn?: boolean;
  wouldReturnNote?: string;
  travelers?: number;
  travelerNames?: string[];
  tags?: string[];
  status: TripStatus;
  isPublic?: boolean;
}

export interface TripDoc extends TripBase {
  id: string;
  slug?: string;
  searchKeywords?: string[];
  createdAt: Timestamp | Date | string;
  updatedAt: Timestamp | Date | string;
  createdBy: string;
}

export type TripFormData = TripBase;
