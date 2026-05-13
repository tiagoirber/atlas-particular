"use client";

import { useCallback, useEffect, useState } from "react";
import { listDays } from "@/lib/days-service";
import type { DayDoc } from "@/types/day";

export function useDays(tripId: string | undefined) {
  const [days, setDays] = useState<DayDoc[]>([]);
  const [loading, setLoading] = useState(!!tripId);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    setError(null);
    try {
      setDays(await listDays(tripId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dias");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { days, loading, error, refresh };
}
