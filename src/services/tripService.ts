import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { mockTrips } from "@/data/mockTrips";
import type { Trip } from "@/types/trip";

const COLLECTION_NAME = "trips";

const getCollection = () => collection(db, COLLECTION_NAME);
const createFallbackId = () =>
  `trip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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
      return { ...data, id: docSnap.id };
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
  try {
    const docRef = await addDoc(getCollection(), {
      ...trip,
      userId,
    });
    return { ...trip, id: docRef.id };
  } catch (error) {
    console.warn("Firestore createTrip 실패, 임시 ID 사용", error);
    return { ...trip, id: trip.id ?? createFallbackId() };
  }
}

export async function updateTrip(
  trip: Trip,
  userId?: string
): Promise<Trip> {
  try {
    await setDoc(doc(db, COLLECTION_NAME, trip.id), { ...trip, userId }, { merge: true });
    return trip;
  } catch (error) {
    console.warn("Firestore updateTrip 실패", error);
    return trip;
  }
}

export async function deleteTrip(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.warn("Firestore deleteTrip 실패", error);
  }
}
