"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { mockPlanDetail, mockTrips } from "@/data/mockTrips";
import type { Trip } from "@/types/trip";
import {
  createTrip as createTripRemote,
  deleteTrip as deleteTripRemote,
  fetchTrips,
  updateTrip as updateTripRemote,
} from "@/services/tripService";
import { useAuth } from "@/context/AuthContext";
import type { Block, Day } from "@/types/trip";

type TripState = {
  trips: Trip[];
  selectedTripId?: string;
  loading: boolean;
};

type TripAction =
  | { type: "setTrips"; payload: Trip[] }
  | { type: "setLoading"; payload: boolean }
  | { type: "addTrip"; payload: Trip }
  | { type: "updateTrip"; payload: Trip }
  | { type: "deleteTrip"; payload: { id: string } }
  | { type: "selectTrip"; payload: { id: string } };

function tripReducer(state: TripState, action: TripAction): TripState {
  switch (action.type) {
    case "setTrips":
      return { ...state, trips: action.payload };
    case "setLoading":
      return { ...state, loading: action.payload };
    case "addTrip":
      return { ...state, trips: [action.payload, ...state.trips] };
    case "updateTrip":
      return {
        ...state,
        trips: state.trips.map((trip) =>
          trip.id === action.payload.id ? action.payload : trip
        ),
      };
    case "deleteTrip":
      return {
        ...state,
        trips: state.trips.filter((trip) => trip.id !== action.payload.id),
      };
    case "selectTrip":
      return { ...state, selectedTripId: action.payload.id };
    default:
      return state;
  }
}

const TripContext = createContext<{
  state: TripState;
  dispatch: React.Dispatch<TripAction>;
} | null>(null);

export function TripProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(tripReducer, {
    trips: mockTrips,
    selectedTripId: mockPlanDetail.id,
    loading: false,
  });

  useEffect(() => {
    let active = true;
    const loadTrips = async () => {
      dispatch({ type: "setLoading", payload: true });
      const data = await fetchTrips(user?.uid);
      if (!active) return;
      dispatch({ type: "setTrips", payload: data });
      if (data.length) {
        dispatch({ type: "selectTrip", payload: { id: data[0].id } });
      }
      dispatch({ type: "setLoading", payload: false });
    };
    loadTrips();
    return () => {
      active = false;
    };
  }, [user?.uid]);

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrips() {
  const context = useContext(TripContext);
  if (!context) throw new Error("useTrips must be used within TripProvider");

  const { state, dispatch } = context;
  const { user } = useAuth();

  const selectedTrip =
    state.trips.find((trip) => trip.id === state.selectedTripId) ??
    mockPlanDetail;

  const selectTrip = useCallback(
    (id: string) => dispatch({ type: "selectTrip", payload: { id } }),
    [dispatch]
  );

  const setLoading = useCallback(
    (value: boolean) => dispatch({ type: "setLoading", payload: value }),
    [dispatch]
  );

  const addTrip = useCallback(
    async (trip: Trip) => {
      setLoading(true);
      const now = new Date().toISOString();
      const created = await createTripRemote(
        {
          ...trip,
          userId: trip.userId || user?.uid || "anonymous-user",
          createdAt: trip.createdAt || now,
          updatedAt: now,
          publicSlug: trip.publicSlug || trip.id,
        },
        user?.uid
      );
      dispatch({ type: "addTrip", payload: created });
      dispatch({ type: "selectTrip", payload: { id: created.id } });
      setLoading(false);
    },
    [dispatch, setLoading, user?.uid]
  );

  const updateTrip = useCallback(
    async (trip: Trip) => {
      setLoading(true);
      const updated = await updateTripRemote(
        { ...trip, updatedAt: new Date().toISOString() },
        user?.uid
      );
      dispatch({ type: "updateTrip", payload: updated });
      setLoading(false);
    },
    [dispatch, setLoading, user?.uid]
  );

  const deleteTrip = useCallback(
    async (id: string) => {
      setLoading(true);
      await deleteTripRemote(id);
      dispatch({ type: "deleteTrip", payload: { id } });
      setLoading(false);
    },
    [dispatch, setLoading]
  );

  const addPlaceToTrip = useCallback(
    async (
      tripId: string,
      place: {
        name: string;
        formattedAddress?: string;
        location?: { lat: number; lng: number };
        placeId?: string;
        rating?: number;
      }
    ) => {
      const targetTrip = state.trips.find((trip) => trip.id === tripId);
      if (!targetTrip) return;

      const existingDays = targetTrip.days ?? [];
      const firstDay = existingDays[0];
      const fallbackDate =
        targetTrip.startDate || new Date().toISOString().split("T")[0];
      const dayId = firstDay?.id ?? `${tripId}-day-${fallbackDate}`;

      const newBlock: Block = {
        id: `block-${Date.now()}`,
        tripId,
        dayId,
        startTime: "10:00",
        endTime: "12:00",
        title: place.name,
        memo: place.formattedAddress ?? "추가된 장소",
        lat: place.location?.lat,
        lng: place.location?.lng,
        address: place.formattedAddress,
        placeId: place.placeId,
        rating: place.rating,
        source: "USER",
      };

      const updatedDays: Day[] = existingDays.length
        ? existingDays.map((day, index) =>
            day.id === dayId || index === 0
              ? { ...day, blocks: [...(day.blocks ?? []), newBlock] }
              : day
          )
        : [
            {
              id: dayId,
              tripId,
              date: fallbackDate,
              title: "",
              summary: "",
              blocks: [newBlock],
            },
          ];

      const updatedTrip: Trip = {
        ...targetTrip,
        days: updatedDays,
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: "updateTrip", payload: updatedTrip });
      await updateTripRemote(updatedTrip, user?.uid);
    },
    [state.trips, dispatch, user?.uid]
  );

  const updateBudget = useCallback(
    async (
      tripId: string,
      budget: NonNullable<Trip["budget"]>
    ) => {
      const targetTrip = state.trips.find((trip) => trip.id === tripId);
      if (!targetTrip) return;

      const updatedTrip: Trip = {
        ...targetTrip,
        budget,
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: "updateTrip", payload: updatedTrip });
      await updateTripRemote(updatedTrip, user?.uid);
    },
    [state.trips, dispatch, user?.uid]
  );

  const addDay = useCallback(
    async (
      tripId: string,
      day: {
        date: string;
        title?: string;
        summary?: string;
      }
    ) => {
      const targetTrip = state.trips.find((trip) => trip.id === tripId);
      if (!targetTrip) return;

      const newDay: Day = {
        id: `day-${Date.now()}`,
        tripId,
        date: day.date,
        title: day.title ?? "",
        summary: day.summary ?? "",
        budgetPlanned: targetTrip.budget?.dailyFood,
        blocks: [],
      };

      const updatedTrip: Trip = {
        ...targetTrip,
        days: [...(targetTrip.days ?? []), newDay],
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: "updateTrip", payload: updatedTrip });
      await updateTripRemote(updatedTrip, user?.uid);
    },
    [state.trips, dispatch, user?.uid]
  );

  const addBlockToDay = useCallback(
    async (
      tripId: string,
      dayId: string,
      block: {
        startTime: string;
        endTime: string;
        title: string;
        memo?: string;
        category?: Block["category"];
      }
    ) => {
      const targetTrip = state.trips.find((trip) => trip.id === tripId);
      if (!targetTrip) return;
      const targetDayExists = (targetTrip.days ?? []).some((day) => day.id === dayId);
      if (!targetDayExists) return;
      const now = new Date().toISOString();
      const updatedTrip: Trip = {
        ...targetTrip,
        days: (targetTrip.days ?? []).map((day) =>
          day.id === dayId
            ? {
                ...day,
                blocks: [
                  ...(day.blocks ?? []),
                  {
                    id: `block-${Date.now()}`,
                    tripId,
                    dayId,
                    startTime: block.startTime,
                    endTime: block.endTime,
                    title: block.title,
                    memo: block.memo,
                    category: block.category,
                    source: "USER",
                  },
                ],
              }
            : day
        ),
        updatedAt: now,
      };

      dispatch({ type: "updateTrip", payload: updatedTrip });
      await updateTripRemote(updatedTrip, user?.uid);
    },
    [state.trips, dispatch, user?.uid]
  );

  const updateBlock = useCallback(
    async (
      tripId: string,
      dayId: string,
      blockId: string,
      patch: Partial<Block>
    ) => {
      const targetTrip = state.trips.find((trip) => trip.id === tripId);
      if (!targetTrip) return;
      const targetDayExists = (targetTrip.days ?? []).some((day) => day.id === dayId);
      if (!targetDayExists) return;
      const now = new Date().toISOString();
      const updatedTrip: Trip = {
        ...targetTrip,
        days: (targetTrip.days ?? []).map((day) =>
          day.id === dayId
            ? {
                ...day,
                blocks: (day.blocks ?? []).map((block) =>
                  block.id === blockId ? { ...block, ...patch } : block
                ),
              }
            : day
        ),
        updatedAt: now,
      };

      dispatch({ type: "updateTrip", payload: updatedTrip });
      await updateTripRemote(updatedTrip, user?.uid);
    },
    [state.trips, dispatch, user?.uid]
  );

  const deleteBlock = useCallback(
    async (tripId: string, dayId: string, blockId: string) => {
      const targetTrip = state.trips.find((trip) => trip.id === tripId);
      if (!targetTrip) return;
      const targetDayExists = (targetTrip.days ?? []).some((day) => day.id === dayId);
      if (!targetDayExists) return;
      const now = new Date().toISOString();
      const updatedTrip: Trip = {
        ...targetTrip,
        days: (targetTrip.days ?? []).map((day) =>
          day.id === dayId
            ? {
                ...day,
                blocks: (day.blocks ?? []).filter((block) => block.id !== blockId),
              }
            : day
        ),
        updatedAt: now,
      };

      dispatch({ type: "updateTrip", payload: updatedTrip });
      await updateTripRemote(updatedTrip, user?.uid);
    },
    [state.trips, dispatch, user?.uid]
  );

  return {
    trips: state.trips,
    selectedTrip,
    loading: state.loading,
    selectTrip,
    addTrip,
    updateTrip,
    deleteTrip,
    addPlaceToTrip,
    updateBudget,
    addDay,
    addBlockToDay,
    updateBlock,
    deleteBlock,
  };
}
