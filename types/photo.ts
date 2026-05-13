import type { Timestamp } from "firebase/firestore";

export interface Photo {
  url: string;
  storagePath: string;
  caption?: string;
  order: number;
  uploadedAt: Timestamp | Date | string;
}

export interface ImageRef {
  url: string;
  storagePath: string;
}
