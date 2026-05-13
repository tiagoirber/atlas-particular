import type { Timestamp } from "firebase/firestore";
import type { AnyDate } from "@/utils/date";
import type { Photo } from "./photo";

export type AttractionType =
  | "cachoeira"
  | "trilha"
  | "restaurante"
  | "hospedagem"
  | "mirante"
  | "museu"
  | "praia"
  | "cidade"
  | "experiencia"
  | "transporte"
  | "outro";

export const ATTRACTION_TYPE_LABEL: Record<AttractionType, string> = {
  cachoeira: "Cachoeira",
  trilha: "Trilha",
  restaurante: "Restaurante",
  hospedagem: "Hospedagem",
  mirante: "Mirante",
  museu: "Museu",
  praia: "Praia",
  cidade: "Cidade",
  experiencia: "Experiência",
  transporte: "Transporte",
  outro: "Outro",
};

export type DifficultyLevel =
  | "nenhuma"
  | "facil"
  | "moderada"
  | "dificil"
  | "muito_dificil";

export const DIFFICULTY_LABEL: Record<DifficultyLevel, string> = {
  nenhuma: "Sem dificuldade",
  facil: "Fácil",
  moderada: "Moderada",
  dificil: "Difícil",
  muito_dificil: "Muito difícil",
};

export interface AttractionBase {
  dayId?: string;
  title: string;
  type: AttractionType;
  visitDate?: AnyDate;
  description?: string;
  notes?: string;
  locationName?: string;
  googleMapsUrl?: string;
  approximateCost?: number;
  currency?: string;
  difficulty?: DifficultyLevel;
  rating?: number; // 1..5
  visitTime?: string; // hh:mm
  timeSpent?: string; // free text "2h", "meio-dia"
  requiresGuide?: boolean;
  distanceOrTransfer?: string;
  bestTimeToVisit?: string;
  whatToBring?: string;
  wouldRecommend?: boolean;
  physicalEffortLevel?: DifficultyLevel;
  risksOrWarnings?: string;
  coverImageUrl?: string;
  coverImagePath?: string;
  photos: import("./photo").Photo[];
  order: number;
}

export interface AttractionDoc extends AttractionBase {
  id: string;
  tripId: string;
  createdAt: Timestamp | Date | string;
  updatedAt: Timestamp | Date | string;
}

export type AttractionFormData = Omit<AttractionBase, "photos"> & {
  photos?: Photo[];
};
