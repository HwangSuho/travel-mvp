"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import MapView from "@/components/map/MapView";
import BudgetPanel from "@/components/budget/BudgetPanel";
import { usePlacesSearch } from "@/hooks/usePlacesSearch";
import { useTrips } from "@/context/TripContext";

const tabs = [
  { id: "timeline", label: "타임라인" },
  { id: "notes", label: "메모" },
  { id: "checklist", label: "준비물" },
];

type PlanClientProps = {
  tripId: string;
};

export default function PlanClient({ tripId }: PlanClientProps) {
  const [activeTab, setActiveTab] = useState("timeline");
  const {
    trips,
    selectedTrip,
    selectTrip,
    addPlaceToTrip,
    loading: tripLoading,
  } = useTrips();
  const {
    results: placeResults,
    loading: placesLoading,
    error: placesError,
    searchPlaces,
  } = usePlacesSearch();
  const [searchInput, setSearchInput] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterOpenNow, setFilterOpenNow] = useState(false);
  const [filterMaxPrice, setFilterMaxPrice] = useState<string>("");
  const [filterRadius, setFilterRadius] = useState("2000");
  const [useTripCenter, setUseTripCenter] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [directionsInfo, setDirectionsInfo] = useState<
    Record<
      string,
      { summary: string; distance: string; duration: string } | undefined
    >
  >({});

  useEffect(() => {
    const exists = trips.some((trip) => trip.id === tripId);
    if (exists) {
      selectTrip(tripId);
    }
  }, [tripId, selectTrip, trips]);

  const trip = trips.find((item) => item.id === tripId) ?? selectedTrip;

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInfoMessage(null);
    await searchPlaces(searchInput.trim(), {
      type: filterType || undefined,
      openNow: filterOpenNow,
      maxPrice: filterMaxPrice || undefined,
      location: useTripCenter
        ? {
            lat: tripCenter.lat,
            lng: tripCenter.lng,
            radius: filterRadius,
          }
        : undefined,
    });
  };

  const handleAddPlace = async (placeId: string) => {
    const place = placeResults.find((item) => item.id === placeId);
    if (!place) return;
    await addPlaceToTrip(tripId, {
      name: place.name,
      formattedAddress: place.formattedAddress,
      location: place.location,
    });
    setInfoMessage(`"${place.name}" 장소가 일정에 추가되었습니다.`);
  };

  const handleDirections = async (dayDate: string) => {
    const day = trip.days?.find((d) => d.date === dayDate);
    if (!day) {
      setInfoMessage("선택한 날짜의 일정 정보를 찾을 수 없습니다.");
      return;
    }
    const itemsWithLocation = day.items.filter(
      (item) => item.location && typeof item.location.lat === "number"
    );
    if (itemsWithLocation.length < 2) {
      setInfoMessage("경로 계산을 위해 위치 정보가 있는 일정이 2개 이상 필요합니다.");
      return;
    }
    const origin = itemsWithLocation[0].location!;
    const destination = itemsWithLocation[itemsWithLocation.length - 1].location!;
    const params = new URLSearchParams({
      originLat: origin.lat.toString(),
      originLng: origin.lng.toString(),
      destinationLat: destination.lat.toString(),
      destinationLng: destination.lng.toString(),
      mode: "transit",
    });
    setInfoMessage("경로 정보를 불러오는 중입니다...");
    try {
      const response = await fetch(`/api/directions?${params.toString()}`);
      if (!response.ok) {
        throw new Error("경로 정보를 가져오지 못했습니다.");
      }
      const data = await response.json();
      if (data.route) {
        setDirectionsInfo((prev) => ({
          ...prev,
          [dayDate]: data.route,
        }));
        setInfoMessage(null);
      } else {
        setInfoMessage("경로 정보를 찾지 못했습니다.");
      }
    } catch (error) {
      console.error(error);
      setInfoMessage("경로 정보를 불러오는 중 오류가 발생했습니다.");
    }
  };

  const markers = useMemo(
    () =>
      placeResults
        .map((place) => place.location)
        .filter(
          (loc): loc is NonNullable<typeof loc> =>
            Boolean(loc && typeof loc.lat === "number" && typeof loc.lng === "number")
        ),
    [placeResults]
  );
  const mapCenter = markers[0] ?? { lat: 37.5665, lng: 126.978 };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="space-y-2">
          <Tag variant="accent" className="text-xs">
            ID: {trip.id}
          </Tag>
          <h1 className="text-3xl font-bold text-gray-900">일정 편집</h1>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-orange-500 hover:underline"
            >
              ← 대시보드로 돌아가기
            </Link>
            <Button variant="secondary" size="sm">
              공유
            </Button>
            <Button variant="ghost" className="bg-slate-900 text-white hover:bg-slate-800">
              PDF 내보내기
            </Button>
          </div>
        </header>
        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {trip.title}
                </h2>
                <p className="text-sm text-gray-500">
                  {trip.dateRange}
                  {trip.timezone ? ` · ${trip.timezone}` : ""}
                </p>
              </div>
              <Button variant="secondary" size="sm">
                기본 정보 편집
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "ghost" : "secondary"}
                  className={
                    activeTab === tab.id
                      ? "bg-slate-900 text-white hover:bg-slate-800"
                      : ""
                  }
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
            <div className="space-y-4">
              {trip.days?.map((day) => (
                <Card key={day.date} className="p-0">
                  <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                    <h3 className="text-sm font-semibold text-slate-700">
                      {day.date}
                    </h3>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="mt-2 text-slate-900 hover:bg-slate-100"
                      onClick={() => handleDirections(day.date)}
                      disabled={tripLoading}
                    >
                      이동 시간 계산
                    </Button>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {day.items.map((item) => (
                      <li key={item.title} className="flex items-center gap-4 px-4 py-3">
                        <div className="text-sm font-semibold text-slate-500">
                          {item.time}
                        </div>
                        <div className="flex-1">
                          <p className="text-base font-semibold text-slate-900">
                            {item.title}
                          </p>
                          <p className="text-sm text-slate-500">{item.memo}</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          편집
                        </Button>
                      </li>
                    ))}
                  </ul>
                  {directionsInfo[day.date] && (
                    <div className="border-t border-slate-100 bg-white px-4 py-3 text-sm text-slate-700">
                      <p className="font-semibold">
                        이동 요약: {directionsInfo[day.date]?.summary || "정보 없음"}
                      </p>
                      <p>
                        예상 시간: {directionsInfo[day.date]?.duration || "-"} / 거리:{" "}
                        {directionsInfo[day.date]?.distance || "-"}
                      </p>
                    </div>
                  )}
                  <div className="border-t border-dashed border-slate-200 px-4 py-3 text-sm text-slate-400">
                    + 시간 블록 추가 (Drag & Drop 예정)
                  </div>
                </Card>
              ))}
            </div>
          </Card>
          <Card className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-slate-900">
                지도 & 장소 검색
              </h3>
              <MapView center={mapCenter} markers={markers} />
              <form className="space-y-3" onSubmit={handleSearch}>
                <label className="text-sm font-semibold text-slate-700">
                  장소 검색
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                    placeholder="예: 타이베이 맛집, 카페"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                  />
                  <select
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                    defaultValue=""
                    onChange={(event) => setFilterType(event.target.value)}
                  >
                    <option value="">전체 카테고리</option>
                    <option value="restaurant">식당</option>
                    <option value="cafe">카페</option>
                    <option value="tourist_attraction">관광지</option>
                    <option value="lodging">숙소</option>
                  </select>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={filterOpenNow}
                      onChange={(event) => setFilterOpenNow(event.target.checked)}
                    />
                    지금 영업 중만 보기
                  </label>
                  <select
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                    value={filterMaxPrice}
                    onChange={(event) => setFilterMaxPrice(event.target.value)}
                  >
                    <option value="">가격 제한 없음</option>
                    <option value="0">저렴함</option>
                    <option value="1">중간</option>
                    <option value="2">높음</option>
                    <option value="3">최고가</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={useTripCenter}
                    onChange={(event) => setUseTripCenter(event.target.checked)}
                  />
                  일정 중심 좌표 기준 반경 검색
                </label>
                {useTripCenter && (
                  <select
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                    value={filterRadius}
                    onChange={(event) => setFilterRadius(event.target.value)}
                  >
                    <option value="1000">1km</option>
                    <option value="2000">2km</option>
                    <option value="3000">3km</option>
                    <option value="5000">5km</option>
                  </select>
                )}
                <Button type="submit" size="sm" disabled={placesLoading}>
                  {placesLoading ? "검색 중..." : "검색"}
                </Button>
                {placesError && (
                  <p className="text-xs text-red-500">{placesError}</p>
                )}
                {infoMessage && (
                  <p className="text-xs text-slate-500">{infoMessage}</p>
                )}
              </form>
              <div className="space-y-3">
                {placeResults.length === 0 && (
                  <p className="text-sm text-slate-500">
                    장소를 검색하면 결과가 여기에 표시됩니다.
                  </p>
                )}
                {placeResults.map((place) => (
                  <div
                    key={place.id}
                    className="rounded-2xl border border-slate-100 p-4 text-sm"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-base font-semibold text-slate-900">
                        {place.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {place.formattedAddress}
                      </p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                      {place.rating && (
                        <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-600">
                          ★ {place.rating} / 리뷰 {place.reviews ?? 0}
                        </span>
                      )}
                      {place.priceLevel !== undefined && (
                        <span className="rounded-full bg-slate-100 px-3 py-1">
                          가격대: {"$".repeat(place.priceLevel + 1)}
                        </span>
                      )}
                      {place.openNow !== undefined && (
                        <span className="rounded-full bg-slate-100 px-3 py-1">
                          {place.openNow ? "영업 중" : "영업 종료"}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                      {place.types?.slice(0, 4).map((type) => (
                        <span
                          key={type}
                          className="rounded-full bg-slate-50 px-3 py-1"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAddPlace(place.id)}
                      >
                        일정에 추가
                      </Button>
                      <a
                        href={`https://agoda-finder.rosua.cc/?city=${encodeURIComponent(
                          place.name
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        숙소 검색 (Agoda Finder)
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2 rounded-xl border border-dashed border-slate-200 p-4 text-sm">
              <h3 className="text-base font-semibold text-slate-900">
                빠른 메모
              </h3>
              {trip.notes?.map((note) => (
                <p key={note} className="rounded-lg bg-slate-50 px-3 py-2 text-slate-600">
                  {note}
                </p>
              ))}
            </div>
            <Button fullWidth>Day 추가 예정</Button>
            <BudgetPanel tripId={tripId} trip={trip} />
          </Card>
        </section>
      </div>
    </main>
  );
}
