"use client";

import { useCallback, useState } from "react";

export type PlaceResult = {
  placeId: string;
  name: string;
  lat?: number;
  lng?: number;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  address?: string;
  openNow?: boolean;
  types?: string[];
};

type SearchOptions = {
  type?: string;
  openNow?: boolean;
  maxPrice?: string;
  location?: { lat: number; lng: number; radius: string };
};

export function usePlacesSearch() {
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchPlaces = useCallback(async (query: string, options?: SearchOptions) => {
    if (!query && !options?.location) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      if (options?.type) params.set("type", options.type);
      if (options?.openNow) params.set("openNow", "true");
      if (options?.maxPrice) params.set("maxPrice", options.maxPrice);
      if (options?.location) {
        params.set("lat", options.location.lat.toString());
        params.set("lng", options.location.lng.toString());
        params.set("radius", options.location.radius);
      }

      const response = await fetch(`/api/places/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error("장소 검색에 실패했습니다.");
      }
      const data = await response.json();
      setResults(data.results ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "장소 검색 중 문제가 발생했습니다.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    results,
    loading,
    error,
    searchPlaces,
    clear: () => setResults([]),
  };
}
