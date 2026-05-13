import type { Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "viewer";

export interface UserProfile {
  uid: string;
  name?: string;
  email: string;
  role: UserRole;
  createdAt: Timestamp;
}
