"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PublicHeader } from "@/components/public-header";
import { listPublishedTrips } from "@/lib/trips-service";
import { formatDateRange } from "@/utils/date";
import type { TripDoc } from "@/types/trip";
import styles from "./viagens.module.css";

export default function ViagensPage() {
  const [trips, setTrips] = useState<TripDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedTag, setSelectedTag] = useState("");

  useEffect(() => {
    listPublishedTrips()
      .then(setTrips)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return trips.filter((trip) => {
      if (selectedCountry && trip.country?.toLowerCase() !== selectedCountry.toLowerCase()) {
        return false;
      }
      if (
        selectedTag &&
        !trip.tags?.some((t) => t.toLowerCase() === selectedTag.toLowerCase())
      ) {
        return false;
      }
      if (!term) return true;
      return (
        trip.title?.toLowerCase().includes(term) ||
        trip.destination?.toLowerCase().includes(term) ||
        trip.country?.toLowerCase().includes(term) ||
        trip.city?.toLowerCase().includes(term) ||
        trip.tags?.some((t) => t.toLowerCase().includes(term))
      );
    });
  }, [trips, searchTerm, selectedCountry, selectedTag]);

  const countries = useMemo(() => {
    return Array.from(new Set(trips.map((t) => t.country).filter(Boolean))).sort();
  }, [trips]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    trips.forEach((trip) => {
      trip.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [trips]);

  return (
    <>
      <PublicHeader />
      <main className={styles.main}>
        <section className={styles.section}>
          <header className={styles.header}>
            <div>
              <h1>Viagens</h1>
              <p>Destinos explorados. {filtered.length > 0 && <>Mostrando {filtered.length}.</>}</p>
            </div>
          </header>

          <div className={styles.controls}>
            <input
              type="search"
              placeholder="Buscar por título, destino, tag…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.search}
            />

            {countries.length > 0 && (
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className={styles.filter}
              >
                <option value="">Todos os países</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            )}

            {allTags.length > 0 && (
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className={styles.filter}
              >
                <option value="">Todas as tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            )}

            {(searchTerm || selectedCountry || selectedTag) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCountry("");
                  setSelectedTag("");
                }}
                className={styles.clearBtn}
              >
                Limpar filtros
              </button>
            )}
          </div>

          {loading ? (
            <p className={styles.empty}>Carregando…</p>
          ) : trips.length === 0 ? (
            <p className={styles.empty}>Nenhuma viagem publicada ainda.</p>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Nenhuma viagem encontrada com esses filtros.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCountry("");
                  setSelectedTag("");
                }}
                className={styles.linkBtn}
              >
                Ver todas as viagens
              </button>
            </div>
          ) : (
            <ul className={styles.grid}>
              {filtered.map((trip) => (
                <li key={trip.id} className={styles.card}>
                  <Link href={`/trips/${trip.id}`} className={styles.cardLink}>
                    <div className={styles.cover}>
                      {trip.coverImageUrl ? (
                        <Image
                          src={trip.coverImageUrl}
                          alt={trip.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 380px"
                        />
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
                      {trip.tags && trip.tags.length > 0 && (
                        <ul className={styles.tags}>
                          {trip.tags.slice(0, 3).map((tag) => (
                            <li key={tag} className={styles.tag}>
                              {tag}
                            </li>
                          ))}
                          {trip.tags.length > 3 && (
                            <li className={styles.tag}>+{trip.tags.length - 3}</li>
                          )}
                        </ul>
                      )}
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
