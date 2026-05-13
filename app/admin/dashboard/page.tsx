"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTrips } from "@/hooks/useTrips";
import { useAuth } from "@/lib/auth-context";
import { TripCardGrid } from "@/components/trips/trip-card-grid";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const { user } = useAuth();
  const { trips, loading, error, refresh } = useTrips();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">(
    "all",
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return trips.filter((trip) => {
      if (statusFilter !== "all" && trip.status !== statusFilter) return false;
      if (!term) return true;
      return (
        trip.title?.toLowerCase().includes(term) ||
        trip.destination?.toLowerCase().includes(term) ||
        trip.country?.toLowerCase().includes(term) ||
        trip.city?.toLowerCase().includes(term) ||
        trip.searchKeywords?.some((k) => k.includes(term))
      );
    });
  }, [trips, search, statusFilter]);

  const counts = useMemo(() => {
    return {
      total: trips.length,
      published: trips.filter((t) => t.status === "published").length,
      draft: trips.filter((t) => t.status === "draft").length,
    };
  }, [trips]);

  return (
    <section className={styles.container}>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Olá{user?.email ? `, ${user.email}` : ""}</p>
          <h1 className={styles.title}>Atlas Particular</h1>
          <p className={styles.subtitle}>
            Seu acervo de viagens. Cadastre, edite e revisite cada destino.
          </p>
        </div>
        <Link href="/admin/trips/new" className={styles.cta}>
          + Nova viagem
        </Link>
      </header>

      <ul className={styles.stats}>
        <li>
          <span className={styles.statValue}>{counts.total}</span>
          <span className={styles.statLabel}>Viagens</span>
        </li>
        <li>
          <span className={styles.statValue}>{counts.published}</span>
          <span className={styles.statLabel}>Publicadas</span>
        </li>
        <li>
          <span className={styles.statValue}>{counts.draft}</span>
          <span className={styles.statLabel}>Rascunhos</span>
        </li>
      </ul>

      <div className={styles.controls}>
        <input
          type="search"
          placeholder="Buscar por título, destino, cidade…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
        />
        <div className={styles.tabs} role="tablist">
          {(["all", "draft", "published"] as const).map((status) => (
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={statusFilter === status}
              className={`${styles.tab} ${statusFilter === status ? styles.tabActive : ""}`}
              onClick={() => setStatusFilter(status)}
            >
              {status === "all"
                ? "Todas"
                : status === "draft"
                  ? "Rascunhos"
                  : "Publicadas"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className={styles.error}>
          {error}{" "}
          <button onClick={refresh} className={styles.linkBtn}>
            tentar de novo
          </button>
        </p>
      )}

      {loading ? (
        <p className={styles.empty}>Carregando…</p>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>Nada por aqui ainda</h2>
          <p>Comece cadastrando sua primeira viagem.</p>
          <Link href="/admin/trips/new" className={styles.cta}>
            + Nova viagem
          </Link>
        </div>
      ) : (
        <TripCardGrid trips={filtered} onChanged={refresh} />
      )}
    </section>
  );
}
