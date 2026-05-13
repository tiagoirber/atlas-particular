"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { listPublishedTrips } from "@/lib/trips-service";
import { formatDateRange } from "@/utils/date";
import type { TripDoc } from "@/types/trip";
import styles from "./viagens.module.css";

export default function ViagensPage() {
  const [trips, setTrips] = useState<TripDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublishedTrips()
      .then(setTrips)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PublicHeader />
      <main className={styles.main}>
        <section className={styles.section}>
          <header className={styles.header}>
            <h1>Viagens</h1>
            <p>Registros publicados deste acervo.</p>
          </header>

          {loading ? (
            <p className={styles.empty}>Carregando…</p>
          ) : trips.length === 0 ? (
            <p className={styles.empty}>Nenhuma viagem publicada ainda.</p>
          ) : (
            <ul className={styles.grid}>
              {trips.map((trip) => (
                <li key={trip.id} className={styles.card}>
                  <Link href={`/trips/${trip.id}`} className={styles.cardLink}>
                    <div className={styles.cover}>
                      {trip.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={trip.coverImageUrl} alt={trip.title} />
                      ) : (
                        <div className={styles.coverPlaceholder} />
                      )}
                    </div>
                    <div className={styles.body}>
                      <h2 className={styles.title}>{trip.title}</h2>
                      <p className={styles.destination}>
                        {[trip.city, trip.state, trip.country]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      <p className={styles.dates}>
                        {formatDateRange(trip.startDate, trip.endDate)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
