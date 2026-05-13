"use client";

import styles from "./confirmation-dialog.module.css";

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDangerous = false,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
        </div>

        <div className={styles.content}>
          <p>{message}</p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className={styles.cancelBtn}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`${styles.confirmBtn} ${isDangerous ? styles.dangerous : ""}`}
          >
            {isLoading ? "Processando…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
