"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTrip } from "@/hooks/useTrips";
import { deleteTrip } from "@/lib/trips-service";
import { TripForm } from "@/components/trips/trip-form";
import { DaysManager } from "@/components/days/days-manager";
import { AttractionsManager } from "@/components/attractions/attractions-manager";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import styles from "../trips.module.css";

type Tab = "info" | "days" | "attractions";

interface PageProps {
  params: { id: string };
}

export default function EditTripPage({ params }: PageProps) {
  const router = useRouter();
  const { trip, loading, error, refresh } = useTrip(params.id);
  const [tab, setTab] = useState<Tab>("info");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function confirmDelete() {
    if (!trip) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteTrip(params.id);
      router.push("/admin/dashboard");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Erro desconhecido ao excluir viagem.");
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  if (loading) {
    return <p className={styles.formHeader}>Carregando viagem…</p>;
  }
  if (error || !trip) {
    return (
      <section className={styles.formContainer}>
        <p>{error || "Viagem não encontrada."}</p>
        <Link href="/admin/dashboard" className={styles.backLink}>
          ← Voltar
        </Link>
      </section>
    );
  }

  return (
    <section className={styles.formContainer}>
      <Link href="/admin/dashboard" className={styles.backLink}>
        ← Voltar
      </Link>
      <header className={styles.formHeader}>
        <h1>{trip.title || "Viagem sem título"}</h1>
        <p>
          {[trip.city, trip.state, trip.country].filter(Boolean).join(", ") || trip.destination}
        </p>
      </header>

      <nav className={styles.tabBar} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "info"}
          className={`${styles.tab} ${tab === "info" ? styles.tabActive : ""}`}
          onClick={() => setTab("info")}
        >
          Informações
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "days"}
          className={`${styles.tab} ${tab === "days" ? styles.tabActive : ""}`}
          onClick={() => setTab("days")}
        >
          Dias
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "attractions"}
          className={`${styles.tab} ${tab === "attractions" ? styles.tabActive : ""}`}
          onClick={() => setTab("attractions")}
        >
          Atrações
        </button>
        <Link
          href={`/trips/${trip.id}`}
          className={styles.tab}
          target="_blank"
        >
          Visualizar ↗
        </Link>
        <button
          type="button"
          className={`${styles.tab} ${styles.tabDanger}`}
          onClick={() => setConfirmingDelete(true)}
          disabled={deleting}
          title="Excluir viagem"
        >
          {deleting ? "Excluindo…" : "🗑️ Excluir"}
        </button>
      </nav>

      {deleteError && (
        <p className={styles.error} role="alert">
          {deleteError}
        </p>
      )}

      {tab === "info" && <TripForm trip={trip} />}
      {tab === "days" && <DaysManager tripId={trip.id} onChanged={refresh} />}
      {tab === "attractions" && (
        <AttractionsManager tripId={trip.id} onChanged={refresh} />
      )}

      <ConfirmationDialog
        isOpen={confirmingDelete}
        title="Excluir viagem"
        message={`Excluir "${trip.title}"? Esta ação é irreversível. Todas as atrações e fotos serão deletadas.`}
        confirmText="Excluir"
        isDangerous
        isLoading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </section>
  );
}
