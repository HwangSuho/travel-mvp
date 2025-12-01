import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { mockPlanDetail, mockTrips } from "@/data/mockTrips";
import type { Trip } from "@/types/trip";

const COLLECTION_NAME = "trips";

const getCollection = () => collection(db, COLLECTION_NAME);
const createFallbackId = () =>
  `trip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeTrip = (trip: Trip): Trip => {
  const now = new Date().toISOString();
  return {
    ...trip,
    createdAt: trip.createdAt || now,
    updatedAt: trip.updatedAt || now,
    userId: trip.userId || "anonymous-user",
  };
};

export async function fetchTrips(userId?: string): Promise<Trip[]> {
  try {
    const baseCollection = getCollection();
    const targetQuery = userId
      ? query(baseCollection, where("userId", "==", userId))
      : baseCollection;
    const snapshot = await getDocs(targetQuery);

    if (snapshot.empty) {
      return mockTrips;
    }

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Trip;
      return normalizeTrip({ ...data, id: docSnap.id });
    });
  } catch (error) {
    console.warn("Firestore fetchTrips 실패, mock 데이터 사용", error);
    return mockTrips;
  }
}

export async function createTrip(
  trip: Trip,
  userId?: string
): Promise<Trip> {
  const normalized = normalizeTrip(trip);
  try {
    const docRef = await addDoc(getCollection(), {
      ...normalized,
      userId: normalized.userId || userId,
    });
    return { ...normalized, id: docRef.id };
  } catch (error) {
    console.warn("Firestore createTrip 실패, 임시 ID 사용", error);
    return { ...normalized, id: trip.id ?? createFallbackId() };
  }
}

export async function updateTrip(
  trip: Trip,
  userId?: string
): Promise<Trip> {
  const normalized = normalizeTrip(trip);
  try {
    await setDoc(
      doc(db, COLLECTION_NAME, normalized.id),
      { ...normalized, userId: normalized.userId || userId },
      { merge: true }
    );
    return normalized;
  } catch (error) {
    console.warn("Firestore updateTrip 실패", error);
    return normalized;
  }
}

export async function deleteTrip(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.warn("Firestore deleteTrip 실패", error);
  }
}

export async function fetchTripBySlug(slug: string): Promise<Trip | null> {
  try {
    const snapshot = await getDocs(
      query(getCollection(), where("publicSlug", "==", slug), limit(1))
    );

    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const data = docSnap.data() as Trip;
      return normalizeTrip({ ...data, id: docSnap.id });
    }
  } catch (error) {
    console.warn("Firestore fetchTripBySlug 실패, mock 데이터로 대체", error);
  }

  const mock =
    mockTrips.find((trip) => trip.publicSlug === slug || trip.id === slug) ||
    (mockPlanDetail.publicSlug === slug || mockPlanDetail.id === slug
      ? mockPlanDetail
      : null);

  return mock ? normalizeTrip(mock) : null;
}
