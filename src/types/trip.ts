export type UserProfile = {
  uid: string;
  displayName?: string;
  email?: string;
  defaultCurrency?: "KRW" | "JPY" | "USD" | "EUR";
  defaultLanguage?: "ko" | "en";
  defaultTravelStyle?: TravelStyle;
};

export type TravelStyle = "SOLO" | "COUPLE" | "FRIENDS" | "FAMILY";

export type BlockCategory =
  | "MORNING"
  | "LUNCH"
  | "AFTERNOON"
  | "DINNER"
  | "NIGHT";

export type BlockSource = "USER" | "AI_VALIDATED" | "AI_DRAFT";

export type Block = {
  id: string;
  tripId: string;
  dayId: string;
  startTime: string; // "09:00"
  endTime: string; // "11:00"
  title: string;
  memo?: string;
  category?: BlockCategory;
  placeId?: string;
  lat?: number;
  lng?: number;
  address?: string;
  rating?: number;
  cost?: number;
  source?: BlockSource;
  placeQueryHint?: string;
};

export type Day = {
  id: string;
  tripId: string;
  date: string; // "YYYY-MM-DD"
  title?: string;
  summary?: string;
  budgetPlanned?: number;
  blocks?: Block[];
};

export type TripBudget = {
  lodgingPerNight?: number;
  dailyFood?: number;
  transport?: number;
  etc?: number;
};

export type TripStatus = "draft" | "scheduled" | "completed";

export type Trip = {
  id: string;
  userId: string;
  title: string;
  destination: string; // "Tokyo, Japan"
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  summary?: string;
  budgetTotal?: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  publicSlug?: string;
  days?: Day[];
  notes?: string[];
  highlights?: string[];
  budget?: TripBudget;
  timezone?: string;
  status?: TripStatus;
};

export type FavoritePlace = {
  id: string;
  userId: string;
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  rating?: number;
  note?: string;
  createdAt: string;
};

export type AiSuggestedBlock = {
  startTime: string;
  endTime: string;
  category: BlockCategory;
  placeName: string;
  placeQueryHint: string;
  area?: string;
  memo?: string;
};

export type ValidatedBlock = AiSuggestedBlock & {
  validationStatus: "VALID" | "NOT_FOUND" | "ERROR";
  placeId?: string;
  lat?: number;
  lng?: number;
  rating?: number;
  address?: string;
};
