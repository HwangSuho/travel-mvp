import type { Block, Day, Trip } from "@/types/trip";

const nowIso = new Date().toISOString();

const buildDay = (overrides: Partial<Day> & { id: string; tripId: string; date: string }): Day => ({
  title: "",
  summary: "",
  budgetPlanned: undefined,
  blocks: [],
  ...overrides,
});

const buildBlock = (
  overrides: Partial<Block> & {
    id: string;
    tripId: string;
    dayId: string;
    startTime: string;
    endTime: string;
    title: string;
  }
): Block => ({
  source: "USER",
  ...overrides,
});

export const mockTrips: Trip[] = [
  {
    id: "seoul-spring",
    userId: "demo-user",
    title: "봄 서울 3박 4일",
    destination: "Seoul, South Korea",
    startDate: "2025-04-02",
    endDate: "2025-04-05",
    summary: "벚꽃 시즌 서울 핵심 코스",
    budgetTotal: 1200000,
    createdAt: nowIso,
    updatedAt: nowIso,
    publicSlug: "seoul-spring",
    status: "draft",
    timezone: "Asia/Seoul",
    highlights: ["북촌 한옥마을", "광장시장 먹거리", "남산타워 야경"],
    days: [
      buildDay({
        id: "seoul-spring-day1",
        tripId: "seoul-spring",
        date: "2025-04-02",
        title: "광화문 & 북촌",
        blocks: [
          buildBlock({
            id: "ss-d1-b1",
            tripId: "seoul-spring",
            dayId: "seoul-spring-day1",
            startTime: "09:30",
            endTime: "11:00",
            title: "경복궁 산책",
            memo: "한복 대여 후 입장",
            category: "MORNING",
            lat: 37.579617,
            lng: 126.977041,
            address: "서울 종로구 사직로 161",
          }),
          buildBlock({
            id: "ss-d1-b2",
            tripId: "seoul-spring",
            dayId: "seoul-spring-day1",
            startTime: "12:30",
            endTime: "14:00",
            title: "광장시장",
            memo: "마약김밥 & 빈대떡",
            category: "LUNCH",
            lat: 37.570388,
            lng: 126.999495,
            address: "서울 종로구 창경궁로 88",
          }),
        ],
      }),
      buildDay({
        id: "seoul-spring-day2",
        tripId: "seoul-spring",
        date: "2025-04-03",
        title: "남산 & 명동",
        blocks: [
          buildBlock({
            id: "ss-d2-b1",
            tripId: "seoul-spring",
            dayId: "seoul-spring-day2",
            startTime: "10:00",
            endTime: "12:00",
            title: "남산타워 전망",
            memo: "케이블카 이용",
            category: "MORNING",
            lat: 37.5511694,
            lng: 126.9882266,
          }),
          buildBlock({
            id: "ss-d2-b2",
            tripId: "seoul-spring",
            dayId: "seoul-spring-day2",
            startTime: "13:00",
            endTime: "14:00",
            title: "명동 쇼핑",
            category: "AFTERNOON",
            lat: 37.563617,
            lng: 126.982108,
          }),
        ],
      }),
    ],
    budget: {
      lodgingPerNight: 130000,
      dailyFood: 60000,
      transport: 40000,
      etc: 30000,
    },
  },
  {
    id: "jeju-summer",
    userId: "demo-user",
    title: "제주 여름 휴양",
    destination: "Jeju, South Korea",
    startDate: "2025-07-11",
    endDate: "2025-07-15",
    summary: "바다와 드라이브 중심",
    createdAt: nowIso,
    updatedAt: nowIso,
    publicSlug: "jeju-summer",
    status: "scheduled",
    highlights: ["협재 해수욕장", "우도 일주", "흑돼지 맛집"],
    budget: {
      lodgingPerNight: 150000,
      dailyFood: 70000,
      transport: 50000,
      etc: 40000,
    },
  },
  {
    id: "tokyo-fall",
    userId: "demo-user",
    title: "도쿄 단풍 여행",
    destination: "Tokyo, Japan",
    startDate: "2025-10-03",
    endDate: "2025-10-07",
    summary: "도심 단풍 & 카페 탐방",
    createdAt: nowIso,
    updatedAt: nowIso,
    publicSlug: "tokyo-fall",
    status: "completed",
    highlights: ["메이지신궁", "시모키타자와 카페", "도쿄타워"],
  },
];

export const mockPlanDetail: Trip = {
  id: "taipei-foodie",
  userId: "demo-user",
  title: "타이베이 미식 투어",
  destination: "Taipei, Taiwan",
  startDate: "2025-05-12",
  endDate: "2025-05-16",
  summary: "야시장과 근교 투어 중심",
  createdAt: nowIso,
  updatedAt: nowIso,
  publicSlug: "taipei-foodie",
  status: "scheduled",
  timezone: "Asia/Taipei",
  highlights: ["융캉제 딤섬", "지우펀 & 스펀 당일치기", "용산사 야경"],
  notes: [
    "Day 1: 용산사 방문 후 융캉제 딤섬",
    "Day 2: 지우펀 & 스펀 당일치기",
    "Day 3: 고궁박물관, 미슐랭 야시장 투어",
  ],
  days: [
    buildDay({
      id: "taipei-day1",
      tripId: "taipei-foodie",
      date: "2025-05-12",
      title: "용산사 & 융캉제",
      blocks: [
        buildBlock({
          id: "tp-d1-b1",
          tripId: "taipei-foodie",
          dayId: "taipei-day1",
          startTime: "09:00",
          endTime: "10:30",
          title: "용산사",
          memo: "기도 & 사진",
          category: "MORNING",
          lat: 25.0375167,
          lng: 121.4995493,
        }),
        buildBlock({
          id: "tp-d1-b2",
          tripId: "taipei-foodie",
          dayId: "taipei-day1",
          startTime: "12:30",
          endTime: "13:30",
          title: "융캉제 딘타이펑",
          memo: "소룡포 대기줄 감안",
          category: "LUNCH",
          lat: 25.033986,
          lng: 121.529411,
        }),
      ],
    }),
    buildDay({
      id: "taipei-day2",
      tripId: "taipei-foodie",
      date: "2025-05-13",
      title: "지우펀 · 스펀",
      blocks: [
        buildBlock({
          id: "tp-d2-b1",
          tripId: "taipei-foodie",
          dayId: "taipei-day2",
          startTime: "10:00",
          endTime: "12:00",
          title: "지우펀 올드 스트리트",
          memo: "버스 이동",
          category: "MORNING",
          lat: 25.10987,
          lng: 121.845,
        }),
        buildBlock({
          id: "tp-d2-b2",
          tripId: "taipei-foodie",
          dayId: "taipei-day2",
          startTime: "15:00",
          endTime: "16:00",
          title: "스펀 천등 날리기",
          memo: "비 올 시 플랜B",
          category: "AFTERNOON",
          lat: 25.04986,
          lng: 121.77579,
        }),
      ],
    }),
  ],
  budget: {
    lodgingPerNight: 110000,
    dailyFood: 65000,
    transport: 50000,
    etc: 30000,
  },
};
