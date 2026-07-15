"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTrips } from "@/hooks/useTrips";
import { useAuth } from "@/lib/auth-context";
import { formatDateRange, toDate } from "@/utils/date";
import { TripCardGrid } from "@/components/trips/trip-card-grid";
import styles from "./dashboard.module.css";

const PAGE_SIZE = 24;

export default function DashboardPage() {
  const { user } = useAuth();
  const { trips, loading, error, refresh } = useTrips();
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search]);

  const sorted = useMemo(() => {
    return [...trips].sort((a, b) => {
      const aTime = toDate(a.createdAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bTime = toDate(b.createdAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return bTime - aTime;
    });
  }, [trips]);

  const lastTrip = sorted[0];
  const pendingDrafts = useMemo(() => {
    return sorted.filter((t) => t.status === "draft").slice(0, 5);
  }, [sorted]);

  const filtered = useMemo(() => {
    if (!search.trim()) return sorted;
    const term = search.trim().toLowerCase();
    return sorted.filter((trip) => {
      return (
        trip.title?.toLowerCase().includes(term) ||
        trip.destination?.toLowerCase().includes(term) ||
        trip.country?.toLowerCase().includes(term) ||
        trip.city?.toLowerCase().includes(term) ||
        trip.searchKeywords?.some((k) => k.toLowerCase().includes(term))
      );
    });
  }, [sorted, search]);

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
          <p className={styles.eyebrow}>Bem-vindo de volta</p>
          <h1 className={styles.title}>Atlas Particular</h1>
          <p className={styles.subtitle}>
            Seu acervo privado de viagens. Registre, edite e reviva cada destino.
          </p>
        </div>
        <Link href="/admin/trips/new" className={styles.cta}>
          + Nova viagem
        </Link>
      </header>

      {/* Last Voyage Section */}
      {lastTrip && (
        <section className={styles.lastVoyageSection}>
          <h2 className={styles.sectionTitle}>Última viagem</h2>
          <Link href={`/admin/trips/${lastTrip.id}`} className={styles.lastVoyageCard}>
            {lastTrip.coverImageUrl && (
              <div className={styles.lastVoyageImage}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lastTrip.coverImageUrl} alt={lastTrip.title} />
              </div>
            )}
            <div className={styles.lastVoyageContent}>
              <div className={styles.lastVoyageHeader}>
                <h3>{lastTrip.title}</h3>
                <span className={`${styles.badge} ${styles[`badge${lastTrip.status}`]}`}>
                  {lastTrip.status === "draft" ? "Rascunho" : "Publicada"}
                </span>
              </div>
              <p className={styles.lastVoyageDestination}>
                {lastTrip.destination}, {lastTrip.country}
              </p>
              <p className={styles.lastVoyageDate}>
                {formatDateRange(lastTrip.startDate, lastTrip.endDate)}
              </p>
              {lastTrip.generalDescription && (
                <p className={styles.lastVoyageDescription}>
                  {lastTrip.generalDescription.substring(0, 150)}
                  {lastTrip.generalDescription.length > 150 ? "…" : ""}
                </p>
              )}
            </div>
          </Link>
        </section>
      )}

      {/* Pending Drafts Section */}
      {pendingDrafts.length > 0 && (
        <section className={styles.draftSection}>
          <h2 className={styles.sectionTitle}>Rascunhos em progresso</h2>
          <ul className={styles.draftList}>
            {pendingDrafts.map((draft) => (
              <li key={draft.id}>
                <Link href={`/admin/trips/${draft.id}`} className={styles.draftItem}>
                  <div className={styles.draftIcon}>📝</div>
                  <div className={styles.draftInfo}>
                    <div className={styles.draftTitle}>{draft.title}</div>
                    <div className={styles.draftMeta}>
                      {draft.destination}, {draft.country}
                    </div>
                  </div>
                  <div className={styles.draftArrow}>→</div>
                </Link>
              </li>
            ))}
          </ul>
          {pendingDrafts.length > 0 && (
            <Link href="/admin/dashboard?filter=draft" className={styles.seeAllLink}>
              Ver todos os rascunhos ({counts.draft})
            </Link>
          )}
        </section>
      )}

      {/* Stats */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{counts.total}</span>
          <span className={styles.statLabel}>Viagens</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{counts.published}</span>
          <span className={styles.statLabel}>Publicadas</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{counts.draft}</span>
          <span className={styles.statLabel}>Rascunhos</span>
        </div>
      </div>

      {/* Search & Browse */}
      <section className={styles.browseSection}>
        <h2 className={styles.sectionTitle}>Todas as viagens</h2>
        <input
          type="search"
          placeholder="Buscar por título, destino, cidade ou tag…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
        />

        {error && (
          <p className={styles.error}>
            {error}{" "}
            <button onClick={refresh} className={styles.linkBtn}>
              tentar de novo
            </button>
          </p>
        )}

        {loading ? (
          <p className={styles.empty}>Carregando viagens…</p>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <p>
              {search ? "Nenhuma viagem encontrada com essa busca." : "Você ainda não registrou nenhuma viagem."}
            </p>
            {!search && (
              <Link href="/admin/trips/new" className={styles.cta}>
                + Nova viagem
              </Link>
            )}
          </div>
        ) : (
          <>
            <TripCardGrid trips={filtered.slice(0, visibleCount)} onChanged={refresh} />
            {filtered.length > visibleCount && (
              <div className={styles.loadMoreWrap}>
                <button
                  type="button"
                  onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                  className={styles.loadMoreBtn}
                >
                  Carregar mais ({filtered.length - visibleCount} restantes)
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </section>
  );
}
