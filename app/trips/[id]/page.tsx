"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { useAuth } from "@/lib/auth-context";
import { getTrip } from "@/lib/trips-service";
import { listDays } from "@/lib/days-service";
import { listAttractions } from "@/lib/attractions-service";
import type { TripDoc } from "@/types/trip";
import type { DayDoc } from "@/types/day";
import type { AttractionDoc, AttractionType } from "@/types/attraction";
import {
  ATTRACTION_TYPE_LABEL,
  type AttractionType as AT,
} from "@/types/attraction";
import {
  formatDateRange,
  formatLongDate,
  daysBetween,
} from "@/utils/date";
import { formatCurrency } from "@/utils/format";
import { ShareButton } from "@/components/trips/share-button";
import { DayNav, type DayNavItem } from "@/components/trips/day-nav";
import { useToast, ToastsContainer } from "@/components/toast";
import styles from "./trip-viewer.module.css";

interface Props {
  params: { id: string };
}

export default function TripViewerPage({ params }: Props) {
  const tripId = params.id;
  const { user, isAdmin } = useAuth();
  const { toasts, addToast, removeToast } = useToast();

  const [trip, setTrip] = useState<TripDoc | null>(null);
  const [days, setDays] = useState<DayDoc[]>([]);
  const [attractions, setAttractions] = useState<AttractionDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<AttractionType | "">("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getTrip(tripId), listDays(tripId), listAttractions(tripId)])
      .then(([t, d, a]) => {
        if (cancelled) return;
        setTrip(t);
        setDays(d);
        setAttractions(a);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Erro ao carregar.");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  const visible = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return attractions.filter((a) => {
      if (dayFilter && a.dayId !== dayFilter) return false;
      if (typeFilter && a.type !== typeFilter) return false;
      if (!term) return true;
      return (
        a.title?.toLowerCase().includes(term) ||
        a.description?.toLowerCase().includes(term) ||
        a.locationName?.toLowerCase().includes(term) ||
        a.notes?.toLowerCase().includes(term)
      );
    });
  }, [attractions, searchTerm, dayFilter, typeFilter]);

  const byDay = useMemo(() => {
    const map = new Map<string, AttractionDoc[]>();
    for (const att of visible) {
      const key = att.dayId || "__none__";
      const arr = map.get(key) || [];
      arr.push(att);
      map.set(key, arr);
    }
    return map;
  }, [visible]);

  if (loading) {
    return (
      <>
        <PublicHeader />
        <TripViewerSkeleton />
      </>
    );
  }

  if (error || !trip) {
    return (
      <>
        <PublicHeader />
        <main className={styles.main}>
          <p>{error || "Viagem não encontrada."}</p>
          <Link href="/viagens">← Voltar</Link>
        </main>
      </>
    );
  }

  // Privacidade: não-admin só vê viagens públicas finalizadas
  const canView = trip.isPublic && trip.status === "published";
  if (!canView && !isAdmin) {
    return (
      <>
        <PublicHeader />
        <main className={styles.main}>
          <p>Esta viagem não está disponível publicamente.</p>
          {!user && <Link href="/login">Entrar como admin</Link>}
        </main>
      </>
    );
  }

  const length = daysBetween(trip.startDate, trip.endDate);
  const usedTypes = Array.from(new Set(attractions.map((a) => a.type))) as AT[];
  const dayNavItems: DayNavItem[] = days.map((d) => ({
    id: d.id,
    label: `Dia ${d.order + 1}`,
  }));

  return (
    <>
      <PublicHeader />
      <article className={styles.article}>
        <header className={styles.hero}>
          {trip.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={trip.coverImageUrl} alt={trip.title} className={styles.heroImg} />
          ) : (
            <div className={styles.heroPlaceholder} />
          )}
          <div className={styles.heroActions}>
            <ShareButton
              title={trip.title}
              onCopied={() => addToast("Link copiado!", "success")}
            />
          </div>
          <div className={styles.heroOverlay}>
            <div className={styles.heroInner}>
              <p className={styles.eyebrow}>
                {[trip.city, trip.state, trip.country].filter(Boolean).join(" · ") ||
                  trip.destination}
              </p>
              <h1 className={styles.title}>{trip.title}</h1>
              <p className={styles.meta}>
                {formatDateRange(trip.startDate, trip.endDate)} · {length} dia
                {length > 1 ? "s" : ""}
              </p>
              {trip.tags && trip.tags.length > 0 && (
                <ul className={styles.tags}>
                  {trip.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </header>

        <section className={styles.section}>
          {trip.generalDescription && (
            <p className={styles.body}>{trip.generalDescription}</p>
          )}
          <div className={styles.factGrid}>
            {!!trip.generalRating && (
              <div>
                <span className={styles.factLabel}>Nota geral</span>
                <span className={styles.factValue}>{trip.generalRating}/5</span>
              </div>
            )}
            {!!trip.approximateTotalCost && (
              <div>
                <span className={styles.factLabel}>Custo</span>
                <span className={styles.factValue}>
                  {formatCurrency(trip.approximateTotalCost, trip.currency || "BRL")}
                </span>
              </div>
            )}
            {trip.mood && (
              <div>
                <span className={styles.factLabel}>Humor</span>
                <span className={styles.factValue}>{trip.mood}</span>
              </div>
            )}
            {typeof trip.wouldReturn === "boolean" && (
              <div>
                <span className={styles.factLabel}>Voltaria?</span>
                <span className={styles.factValue}>
                  {trip.wouldReturn ? "Sim" : "Não"}
                </span>
              </div>
            )}
          </div>

          {(trip.bestMoment || trip.worstMoment) && (
            <div className={styles.split}>
              {trip.bestMoment && (
                <div className={styles.moment}>
                  <h3>Melhor momento</h3>
                  <p>{trip.bestMoment}</p>
                </div>
              )}
              {trip.worstMoment && (
                <div className={styles.moment}>
                  <h3>Pior momento</h3>
                  <p>{trip.worstMoment}</p>
                </div>
              )}
            </div>
          )}

          {trip.notes && (
            <aside className={styles.notes}>
              <h3>Observações</h3>
              <p>{trip.notes}</p>
            </aside>
          )}
        </section>

        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <h2>Roteiro</h2>
            <p>Cada dia da viagem, com as atrações ligadas.</p>
          </header>

          <div className={styles.controls}>
            <input
              type="search"
              placeholder="Buscar atrações…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.search}
            />
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className={styles.select}
            >
              <option value="">Todos os dias</option>
              {days.map((d) => (
                <option key={d.id} value={d.id}>
                  Dia {d.order + 1} · {d.title || formatLongDate(d.date)}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as AttractionType | "")}
              className={styles.select}
            >
              <option value="">Todos os tipos</option>
              {usedTypes.map((t) => (
                <option key={t} value={t}>
                  {ATTRACTION_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>

          <DayNav items={dayNavItems} />

          {days.length === 0 && attractions.length === 0 ? (
            <p className={styles.empty}>Nenhum dia ou atração cadastrada.</p>
          ) : (
            <ol className={styles.timeline}>
              {days.map((day) => {
                const list = byDay.get(day.id) || [];
                if (dayFilter && day.id !== dayFilter) return null;
                return (
                  <li key={day.id} id={day.id} className={styles.dayBlock}>
                    <div className={styles.dayHead}>
                      <span className={styles.dayOrder}>Dia {day.order + 1}</span>
                      <span className={styles.dayDate}>
                        {formatLongDate(day.date)}
                      </span>
                    </div>
                    {day.title && <h3 className={styles.dayTitle}>{day.title}</h3>}
                    {day.summary && <p className={styles.daySummary}>{day.summary}</p>}
                    {list.length > 0 && (
                      <ul className={styles.attractions}>
                        {list.map((a) => (
                          <li key={a.id}>
                            <AttractionCard tripId={tripId} att={a} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}

              {(byDay.get("__none__") || []).length > 0 && !dayFilter && (
                <li className={styles.dayBlock}>
                  <div className={styles.dayHead}>
                    <span className={styles.dayOrder}>Sem dia</span>
                  </div>
                  <ul className={styles.attractions}>
                    {byDay.get("__none__")!.map((a) => (
                      <li key={a.id}>
                        <AttractionCard tripId={tripId} att={a} />
                      </li>
                    ))}
                  </ul>
                </li>
              )}
            </ol>
          )}
        </section>

        {isAdmin && (
          <div className={styles.adminBar}>
            <Link href={`/admin/trips/${trip.id}`} className={styles.adminLink}>
              Editar no painel ↗
            </Link>
          </div>
        )}
        <ToastsContainer toasts={toasts} onClose={removeToast} />
      </article>
    </>
  );
}

function AttractionCard({
  tripId,
  att,
}: {
  tripId: string;
  att: AttractionDoc;
}) {
  return (
    <Link href={`/trips/${tripId}/attractions/${att.id}`} className={styles.attCard}>
      <div className={styles.attCover}>
        {att.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={att.coverImageUrl} alt={att.title} />
        ) : (
          <div className={styles.attCoverPlaceholder} />
        )}
      </div>
      <div className={styles.attBody}>
        <span className={styles.attBadge}>{ATTRACTION_TYPE_LABEL[att.type]}</span>
        <h4>{att.title}</h4>
        {att.locationName && <p className={styles.attLocation}>{att.locationName}</p>}
        {att.description && (
          <p className={styles.attDescription}>{att.description}</p>
        )}
      </div>
    </Link>
  );
}

function TripViewerSkeleton() {
  return (
    <div className={styles.skeletonHero}>
      <div className={styles.skeletonSection}>
        <div className={`${styles.skeletonLine} ${styles.wide}`} />
        <div className={`${styles.skeletonLine} ${styles.short}`} />
      </div>
    </div>
  );
}
