import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Tag from "@/components/ui/Tag";

const highlights = [
  {
    title: "직관적인 일정 편집",
    description: "드래그 앤 드롭으로 날짜·시간 블록을 빠르게 재구성합니다.",
  },
  {
    title: "구글 지도/플레이스 연동 예정",
    description: "지도에서 장소를 찾아 바로 일정에 추가할 수 있도록 준비 중입니다.",
  },
  {
    title: "소셜 로그인",
    description: "Google · Kakao 계정으로 간편하게 시작할 수 있습니다.",
  },
];

const workflow = [
  { step: "01", title: "여행 생성", detail: "여행 이름·기간을 입력하고 기본 정보를 저장" },
  {
    step: "02",
    title: "장소 탐색",
    detail: "지도/플레이스 검색으로 레스토랑·관광지를 탐색",
  },
  { step: "03", title: "일정 정리", detail: "타임라인에 끌어넣으며 메모/예산을 기록" },
];

export default function Home() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#fff7ed] to-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-16">
        <div className="flex flex-col items-center gap-6 text-center">
          <Tag variant="accent">Trip-Mate Phase 1 · Web MVP</Tag>
          <h1 className="text-4xl font-bold leading-snug text-slate-900">
            Trip-Mate 여행 플래너 MVP
          </h1>
          <p className="max-w-2xl text-base text-slate-600">
            여행 계획부터 장소 탐색, 일정 관리까지 한 곳에서 해결하세요. 지도와
            플레이스 연동, 소셜 로그인 등 핵심 기능을 중심으로 빠르게 MVP를
            다듬고 있습니다.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/login">
              <Button size="lg">시작하기</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" size="lg">
                대시보드 보기
              </Button>
            </Link>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {highlights.map((item) => (
            <Card key={item.title} className="border-orange-100/60 bg-white/80">
              <h3 className="text-lg font-semibold text-slate-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 rounded-3xl border border-slate-200 bg-white/70 p-8 md:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">여행 플로우</h2>
            <p className="text-sm text-slate-600">
              Trip-Mate는 여행 기록을 세 단계로 나눠 관리합니다. Firebase 인증과
              Firestore 저장소가 연결되면 동일한 흐름으로 실제 데이터를 다루게
              됩니다.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {workflow.map((item) => (
                <div
                  key={item.step}
                  className="rounded-2xl bg-slate-900/90 p-4 text-white"
                >
                  <p className="text-xs uppercase tracking-wide opacity-70">
                    {item.step}
                  </p>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="mt-1 text-xs opacity-80">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4 rounded-2xl bg-slate-900/5 p-6 text-sm text-slate-600">
            <h3 className="text-base font-semibold text-slate-900">
              Phase 1 진행 상황
            </h3>
            <ul className="space-y-2 text-xs leading-relaxed">
              <li>✅ UI 뼈대, 라우트 구성</li>
              <li>🏗️ Firebase Auth · Firestore 연동 준비 중</li>
              <li>⏳ Google Maps/Places 환경 구성 예정</li>
            </ul>
            <p className="rounded-xl bg-white px-4 py-3 text-[13px] text-slate-500">
              실제 API 키는 .env.local에 설정 후 진행하면 됩니다.
            </p>
          </div>
        </div>
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-8 text-center text-sm text-slate-500">
          지도/장소 미리보기, 일정 공유 등 기능은 추후 API 연동 시 공개될 예정입니다.
        </div>
      </div>
    </section>
  );
}
