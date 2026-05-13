// Deprecated barrel kept for backward compatibility with legacy imports.
// Prefer importing from the granular files: ./trip, ./day, ./attraction, ./photo, ./user.

export type { TripDoc as Trip, TripFormData, TripStatus, TripBase } from "./trip";
export type { DayDoc as Day, DayFormData, DayBase } from "./day";
export type {
  AttractionDoc as Attraction,
  AttractionFormData,
  AttractionBase,
  AttractionType,
  DifficultyLevel,
} from "./attraction";
export type { Photo, ImageRef } from "./photo";
export type { UserProfile, UserRole } from "./user";
