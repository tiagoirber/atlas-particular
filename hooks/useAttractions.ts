"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listAttractions,
  type ListAttractionsFilters,
} from "@/lib/attractions-service";
import type { AttractionDoc } from "@/types/attraction";

export function useAttractions(
  tripId: string | undefined,
  filters: ListAttractionsFilters = {},
) {
  const [attractions, setAttractions] = useState<AttractionDoc[]>([]);
  const [loading, setLoading] = useState(!!tripId);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    setError(null);
    try {
      setAttractions(await listAttractions(tripId, filters));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar atrações");
    } finally {
      setLoading(false);
    }
  }, [tripId, filters.dayId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { attractions, loading, error, refresh };
}
