import type { Timestamp } from "firebase/firestore";

export interface Video {
  url: string;
  storagePath: string;
  youtubeId?: string;
  caption?: string;
  order: number;
  uploadedAt: Timestamp | Date | string;
}
