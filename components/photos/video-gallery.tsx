"use client";

import { useState } from "react";
import type { Video } from "@/types/video";
import styles from "./video-gallery.module.css";

interface Props {
  videos: Video[];
  editable?: boolean;
  onRemove?: (video: Video) => void;
  onCaptionChange?: (video: Video, caption: string) => void;
}

export function VideoGallery({ videos, editable, onRemove, onCaptionChange }: Props) {
  if (videos.length === 0) return null;

  return (
    <ul className={styles.list}>
      {videos.map((video) => (
        <VideoItem
          key={video.storagePath}
          video={video}
          editable={editable}
          onRemove={onRemove}
          onCaptionChange={onCaptionChange}
        />
      ))}
    </ul>
  );
}

interface ItemProps {
  video: Video;
  editable?: boolean;
  onRemove?: (video: Video) => void;
  onCaptionChange?: (video: Video, caption: string) => void;
}

function VideoItem({ video, editable, onRemove, onCaptionChange }: ItemProps) {
  const [caption, setCaption] = useState(video.caption ?? "");

  function handleCaptionBlur() {
    if (caption !== (video.caption ?? "")) {
      onCaptionChange?.(video, caption);
    }
  }

  return (
    <li className={styles.item}>
      <video
        src={video.url}
        controls
        className={styles.player}
        preload="metadata"
      />
      {editable ? (
        <div className={styles.editRow}>
          <input
            type="text"
            className={styles.captionInput}
            value={caption}
            placeholder="Legenda (opcional)"
            onChange={(e) => setCaption(e.target.value)}
            onBlur={handleCaptionBlur}
          />
          {onRemove && (
            <button
              type="button"
              className={styles.removeBtn}
              onClick={() => onRemove(video)}
              aria-label="Remover vídeo"
            >
              ✕
            </button>
          )}
        </div>
      ) : (
        video.caption && <p className={styles.caption}>{video.caption}</p>
      )}
    </li>
  );
}
