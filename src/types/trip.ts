export type ScheduleItem = {
  time: string;
  title: string;
  memo?: string;
  location?: {
    lat: number;
    lng: number;
  };
};

export type DayPlan = {
  date: string;
  items: ScheduleItem[];
};

export type Trip = {
  id: string;
  title: string;
  dateRange: string;
  timezone?: string;
  status: "draft" | "scheduled" | "completed";
  highlights: string[];
  notes?: string[];
  days?: DayPlan[];
  budget?: {
    lodgingPerNight?: number;
    dailyFood?: number;
    transport?: number;
    etc?: number;
  };
};
