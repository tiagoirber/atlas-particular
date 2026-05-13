"use client";

import { useCallback, useEffect, useState } from "react";
import { listTrips, getTrip, type ListTripsFilters } from "@/lib/trips-service";
import type { TripDoc } from "@/types/trip";

export function useTrips(filters?: ListTripsFilters) {
  const [trips, setTrips] = useState<TripDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listTrips(filters);
      setTrips(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar viagens");
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.publicOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { trips, loading, error, refresh };
}

export function useTrip(tripId: string | undefined) {
  const [trip, setTrip] = useState<TripDoc | null>(null);
  const [loading, setLoading] = useState(!!tripId);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    setError(null);
    try {
      setTrip(await getTrip(tripId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar viagem");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { trip, loading, error, refresh };
}
