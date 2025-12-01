import Link from "next/link";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";
import MapView from "@/components/map/MapView";
import type { Trip } from "@/types/trip";
import { fetchTripBySlug } from "@/services/tripService";

type SharePageProps = {
  params: Promise<{ slug: string }>;
};

const formatDateRange = (startDate?: string, endDate?: string) => {
  if (!startDate && !endDate) return "여행일 미정";
  if (!startDate || !endDate) return startDate || endDate || "";
  return `${startDate} - ${endDate}`;
};

const calcDuration = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(diff, 1);
};

export default async function SharePage({ params }: SharePageProps) {
  const { slug } = await params;
  const trip: Trip | null = await fetchTripBySlug(slug);

  if (!trip) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="space-y-3 rounded-2xl bg-white px-6 py-8 text-center text-sm text-slate-600 shadow">
          <p>공유 일정을 찾을 수 없습니다.</p>
          <Link
            href="/"
            className="text-sm font-semibold text-orange-600 underline underline-offset-4"
          >
            홈으로 이동
          </Link>
        </div>
      </main>
    );
  }

  const markers =
    trip.days
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

  const mapCenter = markers[0] ?? { lat: 37.5665, lng: 126.978 };

  const duration = calcDuration(trip.startDate, trip.endDate);
  const budget =
    (trip.budget?.lodgingPerNight ?? 0) * duration +
    (trip.budget?.dailyFood ?? 0) * duration +
    (trip.budget?.transport ?? 0) +
    (trip.budget?.etc ?? 0);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Tag variant="accent" className="text-xs">
              공유 코드: {trip.publicSlug ?? trip.id}
            </Tag>
            <h1 className="text-3xl font-bold text-slate-900">{trip.title}</h1>
            <p className="text-sm text-slate-600">
              {trip.destination} · {formatDateRange(trip.startDate, trip.endDate)}
            </p>
            {trip.summary && (
              <p className="text-sm text-slate-500">{trip.summary}</p>
            )}
          </div>
          <Link href="/dashboard">
            <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              내 대시보드로 이동
            </button>
          </Link>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Day & Block 타임라인</h2>
              <span className="text-xs text-slate-500">
                {trip.days?.length ?? 0}일 · {trip.destination}
              </span>
            </div>
            <div className="space-y-4">
              {trip.days?.map((day) => (
                <Card key={day.id || day.date} className="p-0">
                  <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">{day.date}</h3>
                        {day.title && (
                          <p className="text-xs text-slate-500">{day.title}</p>
                        )}
                        {day.summary && (
                          <p className="text-xs text-slate-500">{day.summary}</p>
                        )}
                      </div>
                      {day.budgetPlanned && (
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                          예산 {day.budgetPlanned.toLocaleString()}원
                        </span>
                      )}
                    </div>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {(day.blocks ?? []).map((block) => (
                      <li key={block.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
                        <div className="text-sm font-semibold text-slate-500 sm:w-32">
                          {block.startTime} - {block.endTime}
                        </div>
                        <div className="flex-1">
                          <p className="text-base font-semibold text-slate-900">
                            {block.title}
                          </p>
                          {block.memo && (
                            <p className="text-sm text-slate-500">{block.memo}</p>
                          )}
                          {block.address && (
                            <p className="text-xs text-slate-500">{block.address}</p>
                          )}
                        </div>
                        {block.category && (
                          <Tag className="bg-slate-100 text-slate-700">{block.category}</Tag>
                        )}
                      </li>
                    ))}
                    {(day.blocks ?? []).length === 0 && (
                      <li className="px-4 py-3 text-sm text-slate-500">
                        아직 블록이 없습니다.
                      </li>
                    )}
                  </ul>
                </Card>
              ))}
              {!trip.days?.length && (
                <Card className="p-4 text-sm text-slate-600">
                  이 일정에는 아직 Day 정보가 없습니다.
                </Card>
              )}
            </div>
          </Card>
          <Card className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-slate-900">지도 미리보기</h3>
              <MapView center={mapCenter} markers={markers} />
              <p className="text-xs text-slate-500">
                공유 페이지에서는 지도에서 확인만 가능하며 수정은 로그인 후 /plan 화면에서 진행합니다.
              </p>
            </div>
            <div className="space-y-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              <h4 className="text-sm font-semibold text-slate-900">예산 요약</h4>
              {trip.budget ? (
                <ul className="space-y-1 text-sm text-slate-700">
                  <li>숙소(1박): {(trip.budget.lodgingPerNight ?? 0).toLocaleString()}원</li>
                  <li>식비(1일): {(trip.budget.dailyFood ?? 0).toLocaleString()}원</li>
                  <li>교통: {(trip.budget.transport ?? 0).toLocaleString()}원</li>
                  <li>기타: {(trip.budget.etc ?? 0).toLocaleString()}원</li>
                  <li className="font-semibold text-slate-900">
                    예상 총액 (~{duration}일): {budget.toLocaleString()}원
                  </li>
                </ul>
              ) : (
                <p className="text-sm text-slate-600">예산 정보가 아직 입력되지 않았습니다.</p>
              )}
            </div>
            {!!trip.highlights?.length && (
              <div className="space-y-2 rounded-2xl border border-dashed border-slate-200 p-4 text-sm">
                <h4 className="text-sm font-semibold text-slate-900">하이라이트</h4>
                <ul className="space-y-1 text-slate-700">
                  {trip.highlights.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </section>
      </div>
    </main>
  );
}
