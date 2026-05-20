"use client";

import { useState } from "react";
import { validateVideoFile } from "@/utils/validators";
import styles from "./photo-uploader.module.css";

interface Props {
  label?: string;
  disabled?: boolean;
  onSelect: (file: File, onProgress: (pct: number) => void) => Promise<void>;
}

export function VideoUploader({
  label = "Enviar vídeo",
  disabled,
  onSelect,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
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

  return (
    <div className={styles.wrap}>
      <label className={`${styles.drop} ${busy ? styles.busy : ""}`}>
        <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          onChange={handleChange}
          disabled={busy || disabled}
        />
        <span>{busy ? `Enviando… ${progress}%` : label}</span>
        <small>MP4, WebM ou MOV · até 500 MB</small>
      </label>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
