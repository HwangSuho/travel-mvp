"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useTrips } from "@/context/TripContext";
import type { Trip } from "@/types/trip";

type BudgetPanelProps = {
  tripId: string;
  trip: Trip;
};

const DEFAULT_BUDGET = {
  lodgingPerNight: 150000,
  dailyFood: 50000,
  transport: 10000,
  etc: 30000,
};

function parseDate(dateString: string) {
  if (!dateString) return null;
  const normalized = dateString
    .trim()
    .replace(/\s+/g, "")
    .replace(/\./g, "-");
  const parts = normalized.split("-");
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map(Number);
  if ([year, month, day].some((value) => Number.isNaN(value))) return null;
  return new Date(year, month - 1, day);
}

function getTripDuration(startDate?: string, endDate?: string) {
  if (!startDate && !endDate) return 1;
  const start = parseDate(startDate ?? "");
  const end = parseDate(endDate ?? "");
  if (!start || !end) return 1;
  const diff = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
  return diff;
}

export default function BudgetPanel({ tripId, trip }: BudgetPanelProps) {
  const { updateBudget, loading } = useTrips();
  const [budget, setBudget] = useState(trip.budget ?? DEFAULT_BUDGET);
  const [message, setMessage] = useState<string | null>(null);

  const nights = getTripDuration(trip.startDate, trip.endDate);

  const total = useMemo(() => {
    const lodging = (budget.lodgingPerNight ?? 0) * nights;
    const food = (budget.dailyFood ?? 0) * nights;
    const transport = budget.transport ?? 0;
    const etc = budget.etc ?? 0;
    return { lodging, food, transport, etc, sum: lodging + food + transport + etc };
  }, [budget, nights]);

  const handleChange = (
    field: keyof typeof budget,
    value: string
  ) => {
    const parsed = Number(value.replace(/[^0-9]/g, ""));
    setBudget((prev) => ({
      ...prev,
      [field]: isNaN(parsed) ? 0 : parsed,
    }));
  };

  const handleSave = async () => {
    await updateBudget(tripId, budget);
    setMessage("예산 정보가 저장되었습니다.");
    setTimeout(() => setMessage(null), 2000);
  };

  const handleReset = () => {
    setBudget(DEFAULT_BUDGET);
    setMessage("예산 입력이 기본값으로 초기화되었습니다.");
    setTimeout(() => setMessage(null), 2000);
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            예산 계산기
          </h3>
          <p className="text-xs text-slate-600">
            N박 M일 기준 예산을 입력하고 총액을 확인하세요.
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-500">
          {nights}일 기준
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-900">
            숙소 (1박)
          </label>
          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            value={budget.lodgingPerNight ?? 0}
            onChange={(event) => handleChange("lodgingPerNight", event.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-900">
            식비 (1일)
          </label>
          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            value={budget.dailyFood ?? 0}
            onChange={(event) => handleChange("dailyFood", event.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-900">
            교통비 (총합)
          </label>
          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            value={budget.transport ?? 0}
            onChange={(event) => handleChange("transport", event.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-900">
            기타 비용
          </label>
          <input
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            value={budget.etc ?? 0}
            onChange={(event) => handleChange("etc", event.target.value)}
          />
        </div>
      </div>
      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">예상 비용 요약</p>
        <ul className="mt-2 space-y-1">
          <li>숙소: {total.lodging.toLocaleString()}원</li>
          <li>식비: {total.food.toLocaleString()}원</li>
          <li>교통: {total.transport.toLocaleString()}원</li>
          <li>기타: {total.etc.toLocaleString()}원</li>
        </ul>
        <p className="mt-2 text-sm font-semibold text-slate-900">
          총합: {total.sum.toLocaleString()}원
        </p>
      </div>
      {message && (
        <p className="text-xs text-orange-600">{message}</p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "저장 중..." : "예산 저장"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="text-slate-900 hover:bg-slate-100"
          onClick={handleReset}
          disabled={loading}
        >
          기본값으로 초기화
        </Button>
      </div>
    </Card>
  );
}
