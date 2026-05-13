"use client";

import { useState } from "react";
import { validateImageFile } from "@/utils/validators";
import styles from "./photo-uploader.module.css";

interface Props {
  label?: string;
  multiple?: boolean;
  disabled?: boolean;
  onSelect: (files: File[]) => Promise<void> | void;
}

export function PhotoUploader({
  label = "Enviar fotos",
  multiple = true,
  disabled,
  onSelect,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    console.log("PhotoUploader.handleChange triggered", e.target.files?.length);
    const list = e.target.files;
    e.target.value = "";
    if (!list || list.length === 0) {
      console.log("No files selected");
      return;
    }
    const files = Array.from(list);
    console.log("Files to upload:", files.length);

    for (const f of files) {
      const v = validateImageFile(f);
      if (!v.ok) {
        console.log("Validation failed:", v.reason);
        setError(v.reason || "Arquivo inválido.");
        return;
      }
    }
    setError("");
    setBusy(true);
    try {
      console.log("Calling onSelect with", files.length, "files");
      await onSelect(files);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Erro ao enviar imagens.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <label className={`${styles.drop} ${busy ? styles.busy : ""}`}>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple={multiple}
          onChange={handleChange}
          disabled={busy || disabled}
        />
        <span>{busy ? "Enviando…" : label}</span>
        <small>JPG, PNG ou WEBP · até 8 MB cada</small>
      </label>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
