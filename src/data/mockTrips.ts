import type { Trip } from "@/types/trip";

export const mockTrips: Trip[] = [
  {
    id: "seoul-spring",
    title: "봄 서울 3박 4일",
    dateRange: "2025.04.02 - 2025.04.05",
    status: "draft",
    highlights: ["북촌 한옥마을", "광장시장 먹거리", "남산타워 야경"],
  },
  {
    id: "jeju-summer",
    title: "제주 여름 휴양",
    dateRange: "2025.07.11 - 2025.07.15",
    status: "scheduled",
    highlights: ["협재 해수욕장", "우도 일주", "흑돼지 맛집"],
  },
  {
    id: "tokyo-fall",
    title: "도쿄 단풍 여행",
    dateRange: "2025.10.03 - 2025.10.07",
    status: "completed",
    highlights: ["메이지신궁", "시모키타자와 카페", "도쿄타워"],
  },
];

export const mockPlanDetail: Trip = {
  id: "taipei-foodie",
  title: "타이베이 미식 투어",
  dateRange: "2025.05.12 - 2025.05.16",
  timezone: "Asia/Taipei",
  status: "scheduled",
  highlights: [],
  notes: [
    "Day 1: 용산사 방문 후 융캉제 딤섬",
    "Day 2: 지우펀 & 스펀 당일치기",
    "Day 3: 고궁박물관, 미슐랭 야시장 투어",
  ],
  days: [
    {
      date: "2025-05-12",
      items: [
        { time: "09:00", title: "용산사", memo: "기도 & 사진" },
        { time: "12:30", title: "융캉제 딘타이펑", memo: "소룡포" },
      ],
    },
    {
      date: "2025-05-13",
      items: [
        { time: "10:00", title: "지우펀 올드 스트리트", memo: "버스 이동" },
        { time: "15:00", title: "스펀 천등 날리기", memo: "비 올 시 플랜B" },
      ],
    },
  ],
};

