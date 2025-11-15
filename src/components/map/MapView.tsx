"use client";

import { useEffect, useRef } from "react";

type LatLng = {
  lat: number;
  lng: number;
};

type MapViewProps = {
  center?: LatLng;
  markers?: LatLng[];
  zoom?: number;
};

const DEFAULT_CENTER: LatLng = { lat: 37.5665, lng: 126.978 };
const DEFAULT_ZOOM = 12;

type GoogleWindow = typeof window & { google?: typeof google };
let googleMapsPromise: Promise<typeof google> | null = null;

function loadGoogleMaps(apiKey: string) {
  const googleWindow = window as GoogleWindow;
  if (googleWindow.google?.maps) {
    return Promise.resolve(googleWindow.google);
  }

  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-google-maps="true"]'
    );

    const waitForGoogle = () => {
      const interval = setInterval(() => {
        if (googleWindow.google?.maps) {
          clearInterval(interval);
          resolve(googleWindow.google);
        }
      }, 50);
    };

    if (existingScript) {
      waitForGoogle();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "true";
    script.onload = () => {
      if (googleWindow.google) {
        resolve(googleWindow.google);
      } else {
        reject(new Error("Google Maps 객체를 찾을 수 없습니다."));
      }
    };
    script.onerror = () => reject(new Error("Google Maps 스크립트 로드 실패"));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

export default function MapView({
  center = DEFAULT_CENTER,
  markers = [],
  zoom = DEFAULT_ZOOM,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map>();
  const markerRefs = useRef<google.maps.Marker[]>([]);

  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ??
    process.env.GOOGLE_MAPS_API_KEY;
  const hasApiKey = Boolean(apiKey);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mapContainerRef.current) return;
    if (!apiKey) return;

    let cancelled = false;

    loadGoogleMaps(apiKey)
      .then((g) => {
        if (cancelled || !mapContainerRef.current) return;

        mapRef.current =
          mapRef.current ||
          new g.maps.Map(mapContainerRef.current, {
            center,
            zoom,
            disableDefaultUI: true,
          });

        mapRef.current.setCenter(center);
        mapRef.current.setZoom(zoom);

        markerRefs.current.forEach((marker) => marker.setMap(null));
        markerRefs.current = [];

        const markerPositions = markers.length ? markers : [center];

        markerPositions.forEach((position) => {
          const marker = new g.maps.Marker({
            map: mapRef.current,
            position,
            title: "Trip-Mate 위치",
          });
          markerRefs.current.push(marker);
        });
      })
      .catch((error) => {
        console.error(error);
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, center, markers, zoom]);

  if (!hasApiKey) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-500">
        Google Maps API 키가 설정되면 지도가 표시됩니다.
      </div>
    );
  }

  return (
    <div className="h-64 w-full rounded-2xl border border-slate-100 bg-white/70">
      <div ref={mapContainerRef} className="h-full w-full rounded-2xl" />
    </div>
  );
}
