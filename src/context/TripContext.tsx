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
      const created = await createTripRemote(trip, user?.uid);
      dispatch({ type: "addTrip", payload: created });
      dispatch({ type: "selectTrip", payload: { id: created.id } });
      setLoading(false);
    },
    [dispatch, setLoading, user?.uid]
  );

  const updateTrip = useCallback(
    async (trip: Trip) => {
      setLoading(true);
      const updated = await updateTripRemote(trip, user?.uid);
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
      }
    ) => {
      const targetTrip = state.trips.find((trip) => trip.id === tripId);
      if (!targetTrip) return;

      const existingDays = targetTrip.days ?? [];
      const firstDayDate = existingDays[0]?.date ?? new Date().toISOString().split("T")[0];
      const scheduleItem = {
        time: "미정",
        title: place.name,
        memo: place.formattedAddress ?? "추가된 장소",
        location: place.location,
      };

      const updatedDays = existingDays.length
        ? existingDays.map((day, index) =>
            index === 0
              ? { ...day, items: [...day.items, scheduleItem] }
              : day
          )
        : [
            {
              date: firstDayDate,
              items: [scheduleItem],
            },
          ];

      const updatedTrip: Trip = {
        ...targetTrip,
        days: updatedDays,
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
  };
}
