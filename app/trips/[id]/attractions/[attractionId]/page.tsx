"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { useAuth } from "@/lib/auth-context";
import { getTrip } from "@/lib/trips-service";
import { getAttraction } from "@/lib/attractions-service";
import {
  ATTRACTION_TYPE_LABEL,
  DIFFICULTY_LABEL,
} from "@/types/attraction";
import type { AttractionDoc } from "@/types/attraction";
import type { TripDoc } from "@/types/trip";
import { PhotoGallery } from "@/components/photos/photo-gallery";
import { VideoGallery } from "@/components/photos/video-gallery";
import { formatLongDate } from "@/utils/date";
import { formatCurrency } from "@/utils/format";
import styles from "./attraction-viewer.module.css";

interface Props {
  params: { id: string; attractionId: string };
}

export default function AttractionViewerPage({ params }: Props) {
  const { user, isAdmin } = useAuth();
  const [trip, setTrip] = useState<TripDoc | null>(null);
  const [att, setAtt] = useState<AttractionDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getTrip(params.id),
      getAttraction(params.id, params.attractionId),
    ])
      .then(([t, a]) => {
        if (cancelled) return;
        setTrip(t);
        setAtt(a);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Erro ao carregar.");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [params.id, params.attractionId]);

  if (loading) {
    return (
      <>
        <PublicHeader />
        <main className={styles.main}>Carregando…</main>
      </>
    );
  }

  if (error || !trip || !att) {
    return (
      <>
        <PublicHeader />
        <main className={styles.main}>
          <p>{error || "Atração não encontrada."}</p>
          <Link href={`/trips/${params.id}`}>← Voltar para a viagem</Link>
        </main>
      </>
    );
  }

  const canView = trip.isPublic && trip.status === "published";
  if (!canView && !isAdmin) {
    return (
      <>
        <PublicHeader />
        <main className={styles.main}>
          <p>Esta atração não está disponível publicamente.</p>
          {!user && <Link href="/login">Entrar como admin</Link>}
        </main>
      </>
    );
  }

  return (
    <>
      <PublicHeader />
      <article className={styles.article}>
        <header className={styles.hero}>
          {att.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={att.coverImageUrl} alt={att.title} className={styles.heroImg} />
          ) : (
            <div className={styles.heroPlaceholder} />
          )}
          <div className={styles.heroOverlay}>
            <div className={styles.heroInner}>
              <Link href={`/trips/${params.id}`} className={styles.backLink}>
                ← {trip.title}
              </Link>
              <p className={styles.eyebrow}>{ATTRACTION_TYPE_LABEL[att.type]}</p>
              <h1 className={styles.title}>{att.title}</h1>
              {att.locationName && (
                <p className={styles.location}>{att.locationName}</p>
              )}
              {att.visitDate && (
                <p className={styles.date}>{formatLongDate(att.visitDate)}</p>
              )}
            </div>
          </div>
        </header>

        <section className={styles.section}>
          {att.description && <p className={styles.body}>{att.description}</p>}

          <dl className={styles.facts}>
            {!!att.rating && (
              <div>
                <dt>Avaliação</dt>
                <dd>{att.rating}/5</dd>
              </div>
            )}
            {!!att.approximateCost && (
              <div>
                <dt>Custo aproximado</dt>
                <dd>{formatCurrency(att.approximateCost, att.currency || "BRL")}</dd>
              </div>
            )}
            {att.difficulty && att.difficulty !== "nenhuma" && (
              <div>
                <dt>Dificuldade</dt>
                <dd>{DIFFICULTY_LABEL[att.difficulty]}</dd>
              </div>
            )}
            {att.physicalEffortLevel && att.physicalEffortLevel !== "nenhuma" && (
              <div>
                <dt>Esforço físico</dt>
                <dd>{DIFFICULTY_LABEL[att.physicalEffortLevel]}</dd>
              </div>
            )}
            {att.visitTime && (
              <div>
                <dt>Hora</dt>
                <dd>{att.visitTime}</dd>
              </div>
            )}
            {att.timeSpent && (
              <div>
                <dt>Tempo no local</dt>
                <dd>{att.timeSpent}</dd>
              </div>
            )}
            {att.distanceOrTransfer && (
              <div>
                <dt>Deslocamento</dt>
                <dd>{att.distanceOrTransfer}</dd>
              </div>
            )}
            {att.bestTimeToVisit && (
              <div>
                <dt>Melhor horário</dt>
                <dd>{att.bestTimeToVisit}</dd>
              </div>
            )}
            {att.whatToBring && (
              <div>
                <dt>O que levar</dt>
                <dd>{att.whatToBring}</dd>
              </div>
            )}
            {att.requiresGuide && (
              <div>
                <dt>Guia</dt>
                <dd>Necessário</dd>
              </div>
            )}
            {att.wouldRecommend && (
              <div>
                <dt>Recomendaria?</dt>
                <dd>Sim</dd>
              </div>
            )}
          </dl>

          {att.googleMapsUrl && (
            <p>
              <a
                href={att.googleMapsUrl}
                target="_blank"
                rel="noreferrer noopener"
                className={styles.mapsLink}
              >
                Abrir no Google Maps ↗
              </a>
            </p>
          )}

          {att.risksOrWarnings && (
            <aside className={styles.warn}>
              <h3>Atenção</h3>
              <p>{att.risksOrWarnings}</p>
            </aside>
          )}

          {att.notes && (
            <aside className={styles.notes}>
              <h3>Notas pessoais</h3>
              <p>{att.notes}</p>
            </aside>
          )}
        </section>

        {att.photos && att.photos.length > 0 && (
          <section className={styles.section}>
            <h2>Galeria</h2>
            <PhotoGallery photos={att.photos} />
          </section>
        )}

        {att.videos && att.videos.length > 0 && (
          <section className={styles.section}>
            <h2>Vídeos</h2>
            <VideoGallery videos={att.videos} />
          </section>
        )}

        {isAdmin && (
          <div className={styles.adminBar}>
            <Link href={`/admin/trips/${trip.id}`} className={styles.adminLink}>
              Editar atrações no painel ↗
            </Link>
          </div>
        )}
      </article>
    </>
  );
}
