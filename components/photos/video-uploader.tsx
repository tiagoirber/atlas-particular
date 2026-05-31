"use client";

import { useState } from "react";
import { validateVideoFile } from "@/utils/validators";
import styles from "./video-uploader.module.css";

function extractYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

interface Props {
  label?: string;
  disabled?: boolean;
  onSelect: (file: File, onProgress: (pct: number) => void) => Promise<void>;
  onAddYoutube?: (youtubeId: string) => Promise<void>;
}

export function VideoUploader({
  label = "Enviar vídeo",
  disabled,
  onSelect,
  onAddYoutube,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [error, setError] = useState("");

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const v = validateVideoFile(file);
    if (!v.ok) {
      setError(v.reason || "Arquivo inválido.");
      return;
    }

    setError("");
    setProgress(0);
    setBusy(true);
    try {
      await onSelect(file, setProgress);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar vídeo.");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }

  async function handleAddYoutube() {
    const id = extractYoutubeId(youtubeUrl.trim());
    if (!id) {
      setError("Link do YouTube inválido. Cole a URL completa do vídeo.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await onAddYoutube!(id);
      setYoutubeUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar vídeo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <label className={`${styles.drop} ${busy ? styles.busy : ""}`}>
        <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={handleChange}
          disabled={busy || disabled}
        />
        <span>{busy && progress > 0 ? `Enviando… ${progress}%` : label}</span>
        <small>MP4, WebM ou MOV · até 500 MB</small>
      </label>

      {onAddYoutube && (
        <>
          <p className={styles.divider}>ou</p>
          <div className={styles.youtubeRow}>
            <input
              type="url"
              className={styles.youtubeInput}
              placeholder="Cole um link do YouTube"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              disabled={busy || disabled}
              onKeyDown={(e) => {
                if (e.key === "Enter" && youtubeUrl.trim()) handleAddYoutube();
              }}
            />
            <button
              type="button"
              className={styles.youtubeBtn}
              onClick={handleAddYoutube}
              disabled={busy || disabled || !youtubeUrl.trim()}
            >
              Adicionar
            </button>
          </div>
        </>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
