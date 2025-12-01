"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import MapView from "@/components/map/MapView";
import BudgetPanel from "@/components/budget/BudgetPanel";
import { usePlacesSearch } from "@/hooks/usePlacesSearch";
import { useTrips } from "@/context/TripContext";
import type { BlockCategory, ValidatedBlock } from "@/types/trip";

const tabs = [
  { id: "timeline", label: "타임라인" },
  { id: "notes", label: "메모" },
  { id: "checklist", label: "준비물" },
];

type BlockDraft = {
  startTime: string;
  endTime: string;
  title: string;
  memo?: string;
  category?: BlockCategory;
};

const defaultBlockDraft: BlockDraft = {
  startTime: "09:00",
  endTime: "10:00",
  title: "",
  memo: "",
  category: undefined,
};

type AiPlanDay = {
  date: string;
  title?: string;
  daySummary?: string;
  blocks: ValidatedBlock[];
};

type AiPlanResult = {
  tripTitle?: string;
  summary?: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: AiPlanDay[];
};

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };
const formatDateRange = (startDate?: string, endDate?: string) => {
  if (!startDate && !endDate) return "여행일 미정";
  if (!startDate || !endDate) return startDate || endDate || "";
  return `${startDate} - ${endDate}`;
};

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
    addDay,
    addBlockToDay,
    updateBlock,
    deleteBlock,
    updateTrip,
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
      {
        distanceText: string;
        durationText: string;
        stepsSummary: string[];
        polyline?: string;
      } | undefined
    >
  >({});
  const [newDay, setNewDay] = useState({ date: "", title: "", summary: "" });
  const [blockDrafts, setBlockDrafts] = useState<Record<string, BlockDraft>>({});
  const [editingBlock, setEditingBlock] = useState<{
    dayId: string;
    blockId: string;
  } | null>(null);
  const [editingBlockDraft, setEditingBlockDraft] = useState<BlockDraft | null>(null);
  const [editingTrip, setEditingTrip] = useState(false);
  const [tripForm, setTripForm] = useState({
    title: "",
    destination: "",
    startDate: "",
    endDate: "",
    summary: "",
  });
  const [aiForm, setAiForm] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    travelStyle: "FRIENDS",
    pace: "BALANCED",
    budgetLevel: "MID",
    mustVisit: "",
  });
  const [aiResult, setAiResult] = useState<AiPlanResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiApplying, setAiApplying] = useState(false);

  useEffect(() => {
    const exists = trips.some((trip) => trip.id === tripId);
    if (exists) {
      selectTrip(tripId);
    }
  }, [tripId, selectTrip, trips]);

  const trip = trips.find((item) => item.id === tripId) ?? selectedTrip;
  useEffect(() => {
    if (!trip) return;
    setTripForm({
      title: trip.title,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      summary: trip.summary ?? "",
    });
    setAiForm((prev) => ({
      ...prev,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
    }));
  }, [trip]);
  const tripCenter = useMemo(() => {
    const locations =
      trip?.days?.flatMap((day) =>
        (day.blocks ?? [])
          .map((block) => {
            if (typeof block.lat === "number" && typeof block.lng === "number") {
              return { lat: block.lat, lng: block.lng };
            }
            return null;
          })
          .filter((loc): loc is { lat: number; lng: number } => Boolean(loc))
      ) ?? [];
    return locations[0] ?? DEFAULT_CENTER;
  }, [trip]);

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
    const place = placeResults.find((item) => item.placeId === placeId);
    if (!place) return;
    await addPlaceToTrip(tripId, {
      name: place.name,
      formattedAddress: place.address,
      location:
        typeof place.lat === "number" && typeof place.lng === "number"
          ? { lat: place.lat, lng: place.lng }
          : undefined,
      placeId: place.placeId,
      rating: place.rating,
    });
    setInfoMessage(`"${place.name}" 장소가 일정에 추가되었습니다.`);
  };

  const handleDirections = async (dayDate: string) => {
    const day = trip?.days?.find((d) => d.date === dayDate);
    if (!day) {
      setInfoMessage("선택한 날짜의 일정 정보를 찾을 수 없습니다.");
      return;
    }
    const itemsWithLocation = (day.blocks ?? []).filter(
      (item) => typeof item.lat === "number" && typeof item.lng === "number"
    );
    if (itemsWithLocation.length < 2) {
      setInfoMessage("경로 계산을 위해 위치 정보가 있는 일정이 2개 이상 필요합니다.");
      return;
    }
    const origin = {
      lat: itemsWithLocation[0].lat!,
      lng: itemsWithLocation[0].lng!,
    };
    const destination = {
      lat: itemsWithLocation[itemsWithLocation.length - 1].lat!,
      lng: itemsWithLocation[itemsWithLocation.length - 1].lng!,
    };
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

  const getBlockDraft = (dayId: string): BlockDraft =>
    blockDrafts[dayId] ?? { ...defaultBlockDraft };

  const updateBlockDraft = (dayId: string, patch: Partial<BlockDraft>) => {
    setBlockDrafts((prev) => ({
      ...prev,
      [dayId]: { ...getBlockDraft(dayId), ...patch },
    }));
  };

  const handleAddDay = async () => {
    if (!trip) return;
    if (!newDay.date) {
      setInfoMessage("Day 날짜를 입력해 주세요.");
      return;
    }
    const duplicated = trip.days?.some((day) => day.date === newDay.date);
    if (duplicated) {
      setInfoMessage("같은 날짜의 Day가 이미 존재합니다.");
      return;
    }
    await addDay(tripId, newDay);
    setNewDay({ date: "", title: "", summary: "" });
    setInfoMessage("새 Day가 추가되었습니다.");
  };

  const handleAddBlock = async (dayId: string) => {
    const draft = getBlockDraft(dayId);
    if (!draft.title.trim()) {
      setInfoMessage("블록 제목을 입력해 주세요.");
      return;
    }
    if (!draft.startTime || !draft.endTime) {
      setInfoMessage("시작/종료 시간을 입력해 주세요.");
      return;
    }
    await addBlockToDay(tripId, dayId, {
      ...draft,
      title: draft.title.trim(),
    });
    setBlockDrafts((prev) => ({
      ...prev,
      [dayId]: { ...defaultBlockDraft },
    }));
    setInfoMessage("새 블록이 추가되었습니다.");
  };

  const handleStartEditBlock = (
    dayId: string,
    block: {
      id: string;
      startTime: string;
      endTime: string;
      title: string;
      memo?: string;
      category?: BlockCategory;
    }
  ) => {
    setEditingBlock({ dayId, blockId: block.id });
    setEditingBlockDraft({
      startTime: block.startTime,
      endTime: block.endTime,
      title: block.title,
      memo: block.memo ?? "",
      category: block.category,
    });
  };

  const handleSaveEditBlock = async () => {
    if (!editingBlock || !editingBlockDraft) return;
    await updateBlock(tripId, editingBlock.dayId, editingBlock.blockId, {
      ...editingBlockDraft,
      title: editingBlockDraft.title.trim(),
    });
    setEditingBlock(null);
    setEditingBlockDraft(null);
    setInfoMessage("블록이 업데이트되었습니다.");
  };

  const handleCancelEditBlock = () => {
    setEditingBlock(null);
    setEditingBlockDraft(null);
  };

  const handleDeleteBlock = async (dayId: string, blockId: string) => {
    await deleteBlock(tripId, dayId, blockId);
    if (editingBlock?.blockId === blockId) {
      handleCancelEditBlock();
    }
    setInfoMessage("블록이 삭제되었습니다.");
  };

  const handleTripInfoSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trip) return;
    if (!tripForm.title.trim() || !tripForm.destination.trim()) {
      setInfoMessage("여행 제목과 목적지를 입력해 주세요.");
      return;
    }
    await updateTrip({
      ...trip,
      title: tripForm.title.trim(),
      destination: tripForm.destination.trim(),
      startDate: tripForm.startDate,
      endDate: tripForm.endDate,
      summary: tripForm.summary.trim() || undefined,
    });
    setEditingTrip(false);
    setInfoMessage("기본 정보가 저장되었습니다.");
  };

  const handleRequestAiPlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAiLoading(true);
    setAiError(null);
    setInfoMessage(null);
    try {
      const body = {
        destination: aiForm.destination || trip.destination,
        startDate: aiForm.startDate || trip.startDate,
        endDate: aiForm.endDate || trip.endDate,
        travelStyle: aiForm.travelStyle,
        pace: aiForm.pace,
        budgetLevel: aiForm.budgetLevel,
        mustVisit: aiForm.mustVisit
          .split(/,|\n/)
          .map((item) => item.trim())
          .filter(Boolean),
      };
      const response = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await response.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error("AI 응답 파싱 실패", parseError, text);
        throw new Error("AI 응답을 파싱할 수 없습니다. 다시 시도해 주세요.");
      }

      if (!response.ok) {
        throw new Error(data.error || "AI 일정 생성에 실패했습니다.");
      }
      setAiResult(data);
      setInfoMessage("AI 일정 초안이 생성되었습니다. 검증된 블록만 반영됩니다.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "AI 일정 생성 중 오류가 발생했습니다.";
      setAiError(message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiPlan = async () => {
    if (!aiResult) return;
    const updatedDays = [...(trip.days ?? [])];
    let addedBlocks = 0;

    aiResult.days?.forEach((day, dayIndex) => {
      const validBlocks = (day.blocks ?? []).filter(
        (block) => block.validationStatus === "VALID"
      );
      if (!validBlocks.length) return;

      const existingIndex = updatedDays.findIndex((d) => d.date === day.date);
      const dayId =
        existingIndex >= 0
          ? updatedDays[existingIndex].id
          : `day-${Date.now()}-${dayIndex}`;

      const baseDay =
        existingIndex >= 0
          ? updatedDays[existingIndex]
          : {
              id: dayId,
              tripId: trip.id,
              date: day.date,
              title: day.title ?? "",
              summary: day.daySummary ?? "",
              blocks: [],
            };

      const newBlocks = validBlocks.map((block, blockIndex) => ({
        id: `ai-${Date.now()}-${dayIndex}-${blockIndex}`,
        tripId: trip.id,
        dayId,
        startTime: block.startTime,
        endTime: block.endTime,
        title: block.placeName,
        memo: block.memo ?? block.placeQueryHint,
        category: block.category,
        placeId: block.placeId,
        lat: block.lat,
        lng: block.lng,
        address: block.address,
        rating: block.rating,
        source: "AI_VALIDATED" as const,
        placeQueryHint: block.placeQueryHint,
      }));

      addedBlocks += newBlocks.length;

      const mergedDay = {
        ...baseDay,
        title: baseDay.title || day.title || "",
        summary: baseDay.summary || day.daySummary || "",
        blocks: [...(baseDay.blocks ?? []), ...newBlocks],
      };

      if (existingIndex >= 0) {
        updatedDays[existingIndex] = mergedDay;
      } else {
        updatedDays.push(mergedDay);
      }
    });

    if (!addedBlocks) {
      setInfoMessage("검증된 블록이 없어 반영할 내용이 없습니다.");
      return;
    }

    setAiApplying(true);
    await updateTrip({
      ...trip,
      title: trip.title || aiResult.tripTitle || trip.title,
      summary: trip.summary ?? aiResult.summary,
      days: updatedDays,
      updatedAt: new Date().toISOString(),
    });
    setAiApplying(false);
    setInfoMessage("AI 검증 결과가 일정에 반영되었습니다.");
  };

  const markers = useMemo(
    () => {
      const searchMarkers =
        placeResults
          .map((place) =>
            typeof place.lat === "number" && typeof place.lng === "number"
              ? { lat: place.lat, lng: place.lng }
              : null
          )
          .filter(
            (loc): loc is { lat: number; lng: number } =>
              Boolean(loc && typeof loc.lat === "number" && typeof loc.lng === "number")
          ) ?? [];
      const scheduleMarkers =
        trip?.days
          ?.flatMap((day) => day.blocks ?? [])
          .map((block) =>
            typeof block.lat === "number" && typeof block.lng === "number"
              ? { lat: block.lat, lng: block.lng }
              : null
          )
          .filter(
            (loc): loc is { lat: number; lng: number } =>
              Boolean(loc && typeof loc.lat === "number" && typeof loc.lng === "number")
          ) ?? [];
      return [...scheduleMarkers, ...searchMarkers];
    },
    [placeResults, trip]
  );
  const mapCenter = markers[0] ?? tripCenter ?? DEFAULT_CENTER;

  if (!trip) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="rounded-2xl bg-white px-6 py-8 text-center text-sm text-slate-600 shadow">
          해당 일정을 찾을 수 없습니다. 대시보드에서 다시 선택해 주세요.
        </div>
      </main>
    );
  }

  const sharePath = `/share/${trip.publicSlug ?? trip.id}`;

  const handleCopyShareLink = async () => {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}${sharePath}` : sharePath;
    try {
      await navigator.clipboard?.writeText(url);
      setInfoMessage("공유 링크를 복사했습니다.");
    } catch (error) {
      console.error(error);
      setInfoMessage("클립보드 복사에 실패했습니다. 새 창에서 공유 페이지를 여세요.");
      if (typeof window !== "undefined") {
        window.open(sharePath, "_blank");
      }
    }
  };

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
            <Link href={sharePath} target="_blank">
              <Button variant="secondary" size="sm">
                공유 페이지 열기
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleCopyShareLink}>
              링크 복사
            </Button>
            <Button variant="ghost" className="bg-slate-900 text-white hover:bg-slate-800">
              PDF 내보내기
            </Button>
          </div>
        </header>
        {infoMessage && (
          <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-700">
            {infoMessage}
          </div>
        )}
        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {trip.title}
                </h2>
                <p className="text-sm text-gray-500">
                  {trip.destination} · {formatDateRange(trip.startDate, trip.endDate)}
                  {trip.timezone ? ` · ${trip.timezone}` : ""}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditingTrip((prev) => !prev)}
              >
                {editingTrip ? "편집 닫기" : "기본 정보 편집"}
              </Button>
            </div>
            {editingTrip && (
              <form
                className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                onSubmit={handleTripInfoSubmit}
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      여행 제목
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      value={tripForm.title}
                      onChange={(event) =>
                        setTripForm((prev) => ({ ...prev, title: event.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      목적지
                    </label>
                    <input
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      value={tripForm.destination}
                      onChange={(event) =>
                        setTripForm((prev) => ({
                          ...prev,
                          destination: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      시작일
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      value={tripForm.startDate}
                      onChange={(event) =>
                        setTripForm((prev) => ({
                          ...prev,
                          startDate: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      종료일
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      value={tripForm.endDate}
                      onChange={(event) =>
                        setTripForm((prev) => ({
                          ...prev,
                          endDate: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    요약
                  </label>
                  <textarea
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                    rows={3}
                    value={tripForm.summary}
                    onChange={(event) =>
                      setTripForm((prev) => ({ ...prev, summary: event.target.value }))
                    }
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" size="sm" disabled={tripLoading}>
                    {tripLoading ? "저장 중..." : "기본 정보 저장"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditingTrip(false);
                      setTripForm({
                        title: trip.title,
                        destination: trip.destination,
                        startDate: trip.startDate,
                        endDate: trip.endDate,
                        summary: trip.summary ?? "",
                      });
                    }}
                  >
                    취소
                  </Button>
                </div>
              </form>
            )}
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
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Day 추가</h3>
                <span className="text-xs text-slate-500">여행일 안에서 자유롭게 추가</span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <input
                  type="date"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  value={newDay.date}
                  onChange={(event) =>
                    setNewDay((prev) => ({ ...prev, date: event.target.value }))
                  }
                />
                <input
                  type="text"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  placeholder="제목 (선택)"
                  value={newDay.title}
                  onChange={(event) =>
                    setNewDay((prev) => ({ ...prev, title: event.target.value }))
                  }
                />
                <input
                  type="text"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  placeholder="요약 (선택)"
                  value={newDay.summary}
                  onChange={(event) =>
                    setNewDay((prev) => ({ ...prev, summary: event.target.value }))
                  }
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={handleAddDay} disabled={tripLoading}>
                  {tripLoading ? "추가 중..." : "Day 추가"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setNewDay({ date: "", title: "", summary: "" })}
                >
                  초기화
                </Button>
              </div>
            </div>
            <div className="space-y-4">
              {trip.days?.map((day) => (
                <Card key={day.id || day.date} className="p-0">
                  <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700">
                          {day.date}
                        </h3>
                        {day.title && (
                          <p className="text-xs text-slate-500">{day.title}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="text-slate-900 hover:bg-slate-100"
                        onClick={() => handleDirections(day.date)}
                        disabled={tripLoading}
                      >
                        이동 시간 계산
                      </Button>
                    </div>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {(day.blocks ?? []).map((item) => {
                      const isEditing =
                        editingBlock?.blockId === item.id &&
                        editingBlock.dayId === day.id;
                      const draft = isEditing
                        ? editingBlockDraft
                        : null;
                      return (
                        <li key={item.id} className="flex flex-col gap-3 px-4 py-3">
                          {isEditing && draft ? (
                            <>
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="flex gap-2">
                                  <input
                                    type="time"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                                    value={draft.startTime}
                                    onChange={(event) =>
                                      setEditingBlockDraft((prev) =>
                                        prev
                                          ? { ...prev, startTime: event.target.value }
                                          : draft
                                      )
                                    }
                                  />
                                  <input
                                    type="time"
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                                    value={draft.endTime}
                                    onChange={(event) =>
                                      setEditingBlockDraft((prev) =>
                                        prev
                                          ? { ...prev, endTime: event.target.value }
                                          : draft
                                      )
                                    }
                                  />
                                </div>
                                <select
                                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                                  value={draft.category ?? ""}
                                  onChange={(event) =>
                                    setEditingBlockDraft((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            category: (event.target.value ||
                                              undefined) as BlockCategory | undefined,
                                          }
                                        : draft
                                    )
                                  }
                                >
                                  <option value="">카테고리 없음</option>
                                  <option value="MORNING">아침</option>
                                  <option value="LUNCH">점심</option>
                                  <option value="AFTERNOON">오후</option>
                                  <option value="DINNER">저녁</option>
                                  <option value="NIGHT">밤</option>
                                </select>
                              </div>
                              <input
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                                value={draft.title}
                                onChange={(event) =>
                                  setEditingBlockDraft((prev) =>
                                    prev ? { ...prev, title: event.target.value } : draft
                                  )
                                }
                              />
                              <textarea
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                                rows={2}
                                value={draft.memo ?? ""}
                                onChange={(event) =>
                                  setEditingBlockDraft((prev) =>
                                    prev ? { ...prev, memo: event.target.value } : draft
                                  )
                                }
                              />
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  onClick={handleSaveEditBlock}
                                  disabled={tripLoading}
                                >
                                  {tripLoading ? "저장 중..." : "저장"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={handleCancelEditBlock}
                                >
                                  취소
                                </Button>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <div className="text-sm font-semibold text-slate-500 sm:w-32">
                                {item.startTime} - {item.endTime}
                              </div>
                              <div className="flex-1">
                                <p className="text-base font-semibold text-slate-900">
                                  {item.title}
                                </p>
                                {item.memo && (
                                  <p className="text-sm text-slate-500">{item.memo}</p>
                                )}
                                {item.category && (
                                  <Tag className="mt-1 bg-slate-100 text-slate-700">
                                    {item.category}
                                  </Tag>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStartEditBlock(day.id, item)}
                                >
                                  편집
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50"
                                  onClick={() => handleDeleteBlock(day.id, item.id)}
                                >
                                  삭제
                                </Button>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                    {(day.blocks ?? []).length === 0 && (
                      <li className="px-4 py-3 text-sm text-slate-500">
                        아직 블록이 없습니다. 아래에서 추가해 보세요.
                      </li>
                    )}
                  </ul>
                  {directionsInfo[day.date] && (
                    <div className="border-t border-slate-100 bg-white px-4 py-3 text-sm text-slate-700">
                      <p className="font-semibold">
                        예상 시간: {directionsInfo[day.date]?.durationText || "-"} / 거리:{" "}
                        {directionsInfo[day.date]?.distanceText || "-"}
                      </p>
                      {!!directionsInfo[day.date]?.stepsSummary?.length && (
                        <p className="text-xs text-slate-500">
                          경로 요약: {directionsInfo[day.date]?.stepsSummary.join(" · ")}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="space-y-2 border-t border-dashed border-slate-200 bg-white px-4 py-4 text-sm">
                    <h4 className="font-semibold text-slate-900">새 블록 추가</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex gap-2">
                        <input
                          type="time"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                          value={getBlockDraft(day.id).startTime}
                          onChange={(event) =>
                            updateBlockDraft(day.id, { startTime: event.target.value })
                          }
                        />
                        <input
                          type="time"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                          value={getBlockDraft(day.id).endTime}
                          onChange={(event) =>
                            updateBlockDraft(day.id, { endTime: event.target.value })
                          }
                        />
                      </div>
                      <select
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                        value={getBlockDraft(day.id).category ?? ""}
                        onChange={(event) =>
                          updateBlockDraft(day.id, {
                            category: (event.target.value ||
                              undefined) as BlockCategory | undefined,
                          })
                        }
                      >
                        <option value="">카테고리 없음</option>
                        <option value="MORNING">아침</option>
                        <option value="LUNCH">점심</option>
                        <option value="AFTERNOON">오후</option>
                        <option value="DINNER">저녁</option>
                        <option value="NIGHT">밤</option>
                      </select>
                    </div>
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      placeholder="블록 제목"
                      value={getBlockDraft(day.id).title}
                      onChange={(event) =>
                        updateBlockDraft(day.id, { title: event.target.value })
                      }
                    />
                    <textarea
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      rows={2}
                      placeholder="메모 (선택)"
                      value={getBlockDraft(day.id).memo}
                      onChange={(event) =>
                        updateBlockDraft(day.id, { memo: event.target.value })
                      }
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAddBlock(day.id)}
                        disabled={tripLoading}
                      >
                        {tripLoading ? "추가 중..." : "블록 추가"}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setBlockDrafts((prev) => ({
                            ...prev,
                            [day.id]: { ...defaultBlockDraft },
                          }))
                        }
                      >
                        초기화
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              {!trip.days?.length && (
                <Card className="p-4 text-sm text-slate-600">
                  아직 등록된 Day가 없습니다. 위에서 날짜를 추가해 주세요.
                </Card>
              )}
            </div>
          </Card>
          <div className="space-y-4">
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
                </form>
                <div className="space-y-3">
                  {placeResults.length === 0 && (
                    <p className="text-sm text-slate-500">
                      장소를 검색하면 결과가 여기에 표시됩니다.
                    </p>
                  )}
                  {placeResults.map((place) => (
                    <div
                      key={place.placeId}
                      className="rounded-2xl border border-slate-100 p-4 text-sm"
                    >
                      <div className="flex flex-col gap-1">
                        <p className="text-base font-semibold text-slate-900">
                          {place.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {place.address}
                        </p>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                        {place.rating && (
                          <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-600">
                            ★ {place.rating} / 리뷰 {place.userRatingsTotal ?? 0}
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
                          onClick={() => handleAddPlace(place.placeId)}
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
                {!trip.notes?.length && (
                  <p className="text-xs text-slate-500">
                    대시보드에서 메모를 추가하면 여기 표시됩니다.
                  </p>
                )}
              </div>
            </Card>
            <BudgetPanel tripId={tripId} trip={trip} />
            <Card className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-slate-900">AI 일정 초안</h3>
                <Tag variant="accent" className="bg-green-50 text-green-700">
                  Gemini + Places 검증
                </Tag>
              </div>
              <p className="text-xs text-slate-600">
                AI는 아이디어를 제안하고, 좌표/평점/주소는 Google Places 검증 결과만 사용합니다.
              </p>
              <form className="space-y-3" onSubmit={handleRequestAiPlan}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      목적지
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      value={aiForm.destination}
                      onChange={(event) =>
                        setAiForm((prev) => ({ ...prev, destination: event.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      여행 스타일
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      value={aiForm.travelStyle}
                      onChange={(event) =>
                        setAiForm((prev) => ({ ...prev, travelStyle: event.target.value }))
                      }
                    >
                      <option value="SOLO">SOLO</option>
                      <option value="COUPLE">COUPLE</option>
                      <option value="FRIENDS">FRIENDS</option>
                      <option value="FAMILY">FAMILY</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      시작일
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      value={aiForm.startDate}
                      onChange={(event) =>
                        setAiForm((prev) => ({ ...prev, startDate: event.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      종료일
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      value={aiForm.endDate}
                      onChange={(event) =>
                        setAiForm((prev) => ({ ...prev, endDate: event.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      이동 페이스
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      value={aiForm.pace}
                      onChange={(event) =>
                        setAiForm((prev) => ({ ...prev, pace: event.target.value }))
                      }
                    >
                      <option value="RELAXED">RELAXED</option>
                      <option value="BALANCED">BALANCED</option>
                      <option value="FAST">FAST</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      예산 레벨
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      value={aiForm.budgetLevel}
                      onChange={(event) =>
                        setAiForm((prev) => ({ ...prev, budgetLevel: event.target.value }))
                      }
                    >
                      <option value="LOW">LOW</option>
                      <option value="MID">MID</option>
                      <option value="HIGH">HIGH</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    꼭 가고 싶은 장소 (쉼표/줄바꿈으로 구분)
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
                    rows={2}
                    placeholder="예: 도톤보리, 오사카성"
                    value={aiForm.mustVisit}
                    onChange={(event) =>
                      setAiForm((prev) => ({ ...prev, mustVisit: event.target.value }))
                    }
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" size="sm" disabled={aiLoading}>
                    {aiLoading ? "생성 중..." : "AI로 일정 생성"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setAiResult(null);
                      setAiError(null);
                      setInfoMessage(null);
                    }}
                  >
                    리셋
                  </Button>
                </div>
                {aiError && (
                  <p className="text-xs text-red-500">{aiError}</p>
                )}
              </form>
              {aiResult && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {aiResult.tripTitle || "AI 제안 일정"}
                      </p>
                      <p className="text-xs text-slate-600">
                        {aiResult.summary || "검증된 장소만 일정에 반영됩니다."}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleApplyAiPlan}
                      disabled={aiApplying || tripLoading}
                    >
                      {aiApplying ? "반영 중..." : "검증된 블록 반영"}
                    </Button>
                  </div>
                  {aiResult.days?.map((day) => (
                    <Card
                      key={day.date}
                      className="space-y-2 border-slate-100 bg-slate-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {day.date}
                          </p>
                          {day.title && (
                            <p className="text-xs text-slate-500">{day.title}</p>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">
                          {(day.blocks ?? []).length}개 제안
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {(day.blocks ?? []).map((block, idx) => (
                          <li
                            key={`${day.date}-${idx}`}
                            className="rounded-xl bg-white px-3 py-2 text-xs text-slate-700"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-semibold text-slate-900">
                                {block.startTime} - {block.endTime} · {block.placeName}
                              </span>
                              <Tag
                                className={
                                  block.validationStatus === "VALID"
                                    ? "bg-green-100 text-green-700"
                                    : block.validationStatus === "NOT_FOUND"
                                    ? "bg-red-50 text-red-600"
                                    : "bg-slate-100 text-slate-700"
                                }
                              >
                                {block.validationStatus === "VALID"
                                  ? "검증 완료"
                                  : block.validationStatus === "NOT_FOUND"
                                  ? "정보 없음"
                                  : "오류"}
                              </Tag>
                            </div>
                            {block.memo && <p className="mt-1">{block.memo}</p>}
                            <p className="text-[11px] text-slate-500">
                              검색어: {block.placeQueryHint}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
