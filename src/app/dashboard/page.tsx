"use client";

import Link from "next/link";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import type { Trip } from "@/types/trip";
import { useTrips } from "@/context/TripContext";
import NewTripForm from "@/components/dashboard/NewTripForm";
import RequireAuth from "@/components/auth/RequireAuth";

const statusLabel: Record<NonNullable<Trip["status"]>, string> = {
  draft: "작성 중",
  scheduled: "일정 예정",
  completed: "완료",
};

const formatDateRange = (startDate?: string, endDate?: string) => {
  if (!startDate && !endDate) return "여행일 미정";
  if (!startDate || !endDate) return startDate || endDate || "";
  return `${startDate} - ${endDate}`;
};

function TripCard({
  trip,
  onDelete,
}: {
  trip: Trip;
  onDelete?: (tripId: string) => void;
}) {
  return (
    <Card className="flex h-full flex-col gap-4 text-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold">{trip.title}</h3>
          <p className="text-sm text-slate-600">
            {trip.destination} · {formatDateRange(trip.startDate, trip.endDate)}
          </p>
        </div>
        <Tag className="bg-slate-100 text-slate-700">
          {(trip.status && statusLabel[trip.status]) || "-"}
        </Tag>
      </div>
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
        {(trip.highlights ?? []).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-3 text-sm font-medium">
        <Link href={`/plan/${trip.id}`}>
          <Button size="sm" className="bg-orange-500 text-white hover:bg-orange-600">
            편집하기 →
          </Button>
        </Link>
        <Link href={`/share/${trip.publicSlug ?? trip.id}`} target="_blank">
          <Button
            variant="secondary"
            size="sm"
            className="text-slate-900 hover:bg-slate-100"
          >
            공유 링크
          </Button>
        </Link>
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-500 hover:bg-red-50 hover:text-red-600"
            onClick={() => onDelete(trip.id)}
          >
            삭제
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { trips, deleteTrip } = useTrips();
  const [showNewTripForm, setShowNewTripForm] = useState(false);
  const upcomingTrips = trips.filter((trip) =>
    ["draft", "scheduled"].includes(trip.status ?? "")
  );
  const recentTrips = trips.filter((trip) => trip.status === "completed");
  return (
    <RequireAuth>
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="space-y-2 text-slate-900">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            Trip-Mate
          </p>
          <h1 className="text-3xl font-bold">나의 여행 일정</h1>
          <p className="text-sm text-slate-700">
            실제 데이터 연동 전까지는 예시 일정이 표시됩니다.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Button
              className="bg-slate-900 text-white hover:bg-slate-800"
              onClick={() => setShowNewTripForm((prev) => !prev)}
            >
              {showNewTripForm ? "입력 닫기" : "새 여행 만들기"}
            </Button>
            <Button variant="secondary" className="text-slate-900 hover:bg-slate-100">
              캘린더 보기 (준비 중)
            </Button>
          </div>
        </header>
        {showNewTripForm && (
          <NewTripForm onClose={() => setShowNewTripForm(false)} />
        )}
        <section className="space-y-6 text-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">다가오는 여행</h2>
            <p className="text-xs text-slate-700">
              Firebase 연동 시 자동 정렬 예정
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {upcomingTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onDelete={(id) => {
                  const confirmed = window.confirm("이 일정을 삭제하시겠습니까?");
                  if (confirmed) deleteTrip(id);
                }}
              />
            ))}
          </div>
        </section>
        <section className="space-y-4 text-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">최근 여행</h2>
            <Link href="/dashboard" className="text-xs font-semibold text-orange-600">
              전체 보기
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {recentTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onDelete={(id) => {
                  const confirmed = window.confirm("이 일정을 삭제하시겠습니까?");
                  if (confirmed) deleteTrip(id);
                }}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
    </RequireAuth>
  );
}
