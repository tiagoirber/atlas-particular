"use client";

import { useState } from "react";
import styles from "./share-button.module.css";

interface ShareButtonProps {
  title: string;
  onCopied: () => void;
}

export function ShareButton({ title, onCopied }: ShareButtonProps) {
  const [busy, setBusy] = useState(false);

  async function handleShare() {
    if (busy) return;
    setBusy(true);
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
    } finally {
      setBusy(false);
    }
    await navigator.clipboard.writeText(url);
    onCopied();
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={styles.shareBtn}
      aria-label="Compartilhar viagem"
      disabled={busy}
    >
      <span aria-hidden="true">⤴</span> Compartilhar
    </button>
  );
}
