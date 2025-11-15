"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useTrips } from "@/context/TripContext";
import type { Trip } from "@/types/trip";

type NewTripFormProps = {
  onClose?: () => void;
};

const defaultStatus: Trip["status"] = "draft";

export default function NewTripForm({ onClose }: NewTripFormProps) {
  const { addTrip, loading } = useTrips();
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle("");
    setStartDate("");
    setEndDate("");
    setNotes("");
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("여행 제목을 입력해 주세요.");
      return;
    }
    if (!startDate || !endDate) {
      setError("여행 시작일과 종료일을 선택해 주세요.");
      return;
    }
    setError(null);

    const dateRange = `${startDate} - ${endDate}`;
    const newTrip: Trip = {
      id: `temp-${Date.now()}`,
      title: title.trim(),
      dateRange,
      status: defaultStatus,
      highlights: [],
      notes: notes
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      days: [],
    };

    await addTrip(newTrip);
    resetForm();
    onClose?.();
  };

  return (
    <Card className="mt-4 space-y-4">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-900">
            여행 제목
          </label>
          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            placeholder="예: 2025 봄 교토 미식 여행"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">
              시작일
            </label>
            <input
              type="date"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-900">
              종료일
            </label>
            <input
              type="date"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-900">
            메모 (선택)
          </label>
          <textarea
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            rows={3}
            placeholder="여행 메모를 줄바꿈으로 구분해 입력하세요."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500">
            줄바꿈마다 메모 항목으로 저장됩니다.
          </p>
        </div>
        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "생성 중..." : "새 여행 저장"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="text-slate-900 hover:bg-slate-100"
            onClick={resetForm}
          >
            입력 초기화
          </Button>
        </div>
      </form>
    </Card>
  );
}
