import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../config/firebase";

export async function getBarberBookingsByDate(
  barberId,
  appointmentDate
) {
  if (!barberId || !appointmentDate) {
    throw new Error("Barber ID and appointment date are required.");
  }

  const bookingsRef = collection(db, "bookings");

  const bookingsQuery = query(
    bookingsRef,
    where("barberId", "==", barberId),
    where("appointmentDate", "==", appointmentDate)
  );

  const bookingsSnapshot = await getDocs(bookingsQuery);

  return bookingsSnapshot.docs.map((bookingDoc) => ({
    id: bookingDoc.id,
    ...bookingDoc.data(),
  }));
}
export async function getBookingsForBarber(barberId) {
  if (!barberId) {
    throw new Error("Barber ID is required.");
  }

  const bookingsRef = collection(db, "bookings");

  const bookingsQuery = query(
    bookingsRef,
    where("barberId", "==", barberId)
  );

  const bookingsSnapshot = await getDocs(bookingsQuery);

  return bookingsSnapshot.docs.map((bookingDoc) => ({
    id: bookingDoc.id,
    ...bookingDoc.data(),
  }));
}
async function updateBookingStatus(
  bookingId,
  newStatus,
  changedBy = null
) {
  if (!bookingId) {
    throw new Error("Booking ID is required.");
  }

  const bookingRef = doc(db, "bookings", bookingId);

  const updates = {
    status: newStatus,
    updatedAt: serverTimestamp(),
  };

  if (newStatus === "cancelled") {
    if (!changedBy) {
      throw new Error(
        "The cancelling user ID is required."
      );
    }

    updates.cancelledBy = changedBy;
  }
  await updateDoc(bookingRef, updates);
}

export async function confirmBooking(bookingId) {
  return updateBookingStatus(bookingId, "confirmed");
}


export async function cancelBooking(
  bookingId,
  cancelledBy
) {
  return updateBookingStatus(
    bookingId,
    "cancelled",
    cancelledBy
  );
}
export async function completeBooking(bookingId) {
  return updateBookingStatus(bookingId, "completed");
}


