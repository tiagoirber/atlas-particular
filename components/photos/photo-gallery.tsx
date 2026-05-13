"use client";

import type { Photo } from "@/types/photo";
import styles from "./photo-gallery.module.css";

interface Props {
  photos: Photo[];
  onRemove?: (photo: Photo) => void;
  onCaptionChange?: (photo: Photo, caption: string) => void;
  editable?: boolean;
}

export function PhotoGallery({
  photos,
  onRemove,
  onCaptionChange,
  editable = false,
}: Props) {
  if (!photos || photos.length === 0) {
    return <p className={styles.empty}>Nenhuma foto enviada ainda.</p>;
  }

  return (
    <ul className={styles.grid}>
      {photos.map((photo, idx) => (
        <li key={photo.storagePath || `${photo.url}-${idx}`} className={styles.item}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt={photo.caption || `Foto ${idx + 1}`} loading="lazy" />
          {editable ? (
            <div className={styles.editable}>
              <input
                type="text"
                placeholder="Legenda"
                defaultValue={photo.caption || ""}
                onBlur={(e) => onCaptionChange?.(photo, e.target.value)}
                className={styles.captionInput}
              />
              <button
                type="button"
                onClick={() => onRemove?.(photo)}
                className={styles.removeBtn}
              >
                Remover
              </button>
            </div>
          ) : (
            photo.caption && <figcaption className={styles.caption}>{photo.caption}</figcaption>
          )}
        </li>
      ))}
    </ul>
  );
}
