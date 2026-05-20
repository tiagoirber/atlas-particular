export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

export interface ImageValidationResult {
  ok: boolean;
  reason?: string;
}

export function validateImageFile(file: File): ImageValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      ok: false,
      reason: `Formato não suportado. Aceitos: JPG, PNG, WEBP.`,
    };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    const mb = (MAX_IMAGE_BYTES / 1024 / 1024).toFixed(0);
    return { ok: false, reason: `Imagem maior que ${mb} MB.` };
  }
  return { ok: true };
}

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime", // .mov
];

export const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500 MB

export interface VideoValidationResult {
  ok: boolean;
  reason?: string;
}

export function validateVideoFile(file: File): VideoValidationResult {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return {
      ok: false,
      reason: `Formato não suportado. Aceitos: MP4, WebM, MOV.`,
    };
  }
  if (file.size > MAX_VIDEO_BYTES) {
    const mb = (MAX_VIDEO_BYTES / 1024 / 1024).toFixed(0);
    return { ok: false, reason: `Vídeo maior que ${mb} MB.` };
  }
  return { ok: true };
}

export function isNonEmpty(value: string | undefined | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function clampRating(value: number, min = 1, max = 5): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}
