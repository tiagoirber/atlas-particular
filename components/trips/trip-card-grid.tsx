"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { TripDoc } from "@/types/trip";
import { formatDateRange } from "@/utils/date";
import { deleteTrip } from "@/lib/trips-service";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import styles from "./trip-card-grid.module.css";

interface Props {
  trips: TripDoc[];
  onChanged?: () => void;
}

export function TripCardGrid({ trips, onChanged }: Props) {
  const [pendingDelete, setPendingDelete] = useState<TripDoc | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    const trip = pendingDelete;
    if (!trip) return;
    setError(null);
    setDeletingId(trip.id);
    try {
      await deleteTrip(trip.id);
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir viagem.");
    } finally {
      setDeletingId(null);
      setPendingDelete(null);
    }
  }

  return (
    <>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <ul className={styles.grid}>
        {trips.map((trip) => (
          <li key={trip.id} className={styles.card}>
            <Link
              href={`/admin/trips/${trip.id}`}
              className={styles.cover}
              aria-label={`Editar ${trip.title}`}
            >
              {trip.coverImageUrl ? (
                <Image
                  src={trip.coverImageUrl}
                  alt={trip.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 400px"
                />
              ) : (
                <div className={styles.coverPlaceholder} />
              )}
              <span
                className={`${styles.statusPill} ${
                  trip.status === "published" ? styles.published : styles.draft
                }`}
              >
                {trip.status === "published" ? "Publicada" : "Rascunho"}
              </span>
            </Link>
            <div className={styles.body}>
              <h3 className={styles.title}>
                <Link href={`/admin/trips/${trip.id}`}>{trip.title}</Link>
              </h3>
              <p className={styles.destination}>
                {[trip.city, trip.state, trip.country]
                  .filter(Boolean)
                  .join(", ") || trip.destination}
              </p>
              <p className={styles.dates}>
                {formatDateRange(trip.startDate, trip.endDate)}
              </p>
              <div className={styles.actions}>
                <Link
                  href={`/admin/trips/${trip.id}`}
                  className={styles.actionLink}
                >
                  Editar
                </Link>
                <Link
                  href={`/trips/${trip.id}`}
                  className={styles.actionLink}
                  target="_blank"
                >
                  Visualizar
                </Link>
                <button
                  type="button"
                  onClick={() => setPendingDelete(trip)}
                  className={styles.deleteBtn}
                  disabled={deletingId === trip.id}
                >
                  {deletingId === trip.id ? "Excluindo…" : "Excluir"}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <ConfirmationDialog
        isOpen={!!pendingDelete}
        title="Excluir viagem"
        message={`Excluir a viagem "${pendingDelete?.title}"? Isso remove dias, atrações e fotos associadas. Essa ação não pode ser desfeita.`}
        confirmText="Excluir"
        isDangerous
        isLoading={!!pendingDelete && deletingId === pendingDelete.id}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
