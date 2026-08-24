import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../config/firebase";

function getBarberClientRef({ barberId, clientId }) {
  return doc(
    db,
    "barbers",
    barberId,
    "clients",
    clientId
  );
}

function getBookingClientFields(booking) {
  return {
    clientId: booking.clientId,
    clientName: booking.clientName || "Client",
    clientProfileImageUrl: booking.clientProfileImageUrl || "",
    lastBookingId: booking.id || "",
    lastBookedAt: booking.appointmentDate || "",
    updatedAt: serverTimestamp(),
  };
}

async function setBarberClientDoc({
  barberClientRef,
  data,
}) {
  const barberClientSnap = await getDoc(barberClientRef);
  const nextData = {
    ...data,
  };

  if (!barberClientSnap.exists()) {
    nextData.createdAt = serverTimestamp();
  }

  await setDoc(
    barberClientRef,
    nextData,
    { merge: true }
  );
}

export async function getBarberClient({
  barberId,
  clientId,
}) {
  if (!barberId || !clientId) {
    throw new Error(
      "barberId and clientId are required to load barber client."
    );
  }

  const barberClientRef = getBarberClientRef({
    barberId,
    clientId,
  });

  const barberClientSnap = await getDoc(barberClientRef);

  if (!barberClientSnap.exists()) {
    return null;
  }

  return {
    id: barberClientSnap.id,
    ...barberClientSnap.data(),
  };
}

export async function getBarberClients(barberId) {
  if (!barberId) {
    throw new Error("barberId is required to load clients.");
  }

  const barberClientsRef = collection(
    db,
    "barbers",
    barberId,
    "clients"
  );

  const barberClientsQuery = query(
    barberClientsRef,
    orderBy("updatedAt", "desc")
  );

  const barberClientsSnap = await getDocs(barberClientsQuery);

  const barberClients = await Promise.all(
    barberClientsSnap.docs.map(async (barberClientDoc) => {
      const barberClient = {
        id: barberClientDoc.id,
        ...barberClientDoc.data(),
      };

      try {
        const [userSnap, clientSnap] = await Promise.all([
          getDoc(doc(db, "users", barberClient.id)),
          getDoc(doc(db, "clients", barberClient.id)),
        ]);

        const userData = userSnap.exists() ? userSnap.data() : {};
        const clientData = clientSnap.exists() ? clientSnap.data() : {};

        return {
          ...barberClient,
          clientName:
            clientData.preferredName ||
            userData.fullName ||
            barberClient.clientName ||
            "Client",
          clientEmail: userData.email || barberClient.clientEmail || "",
          clientProfileImageUrl:
            clientData.profileImageUrl ||
            barberClient.clientProfileImageUrl ||
            "",
          clientLocation: clientData.location || null,
        };
      } catch (error) {
        console.log("Enrich barber client error:", error);
        return barberClient;
      }
    })
  );

  return barberClients;
}

export async function upsertBarberClientFromBooking({
  barberId,
  booking,
  amountsBooked = 1,
  amountPayed = 0,
}) {
  if (!barberId || !booking?.clientId) {
    throw new Error(
      "barberId and booking.clientId are required to save barber client."
    );
  }

  const barberClientRef = getBarberClientRef({
    barberId,
    clientId: booking.clientId,
  });

  await setBarberClientDoc({
    barberClientRef,
    data: {
      ...getBookingClientFields(booking),
      amountsBooked,
      amountPayed,
    },
  });
}

export async function updateBarberClientPrivateNote({
  barberId,
  booking,
  noteBody,
  amountsBooked = 1,
  amountPayed = 0,
}) {
  if (!barberId || !booking?.clientId) {
    throw new Error(
      "barberId and booking.clientId are required to save client note."
    );
  }

  const trimmedNoteBody = noteBody?.trim() || "";
  const barberClientRef = getBarberClientRef({
    barberId,
    clientId: booking.clientId,
  });

  await setBarberClientDoc({
    barberClientRef,
    data: {
      ...getBookingClientFields(booking),
      amountsBooked,
      amountPayed,
      privateNote: {
        body: trimmedNoteBody,
        updatedAt: serverTimestamp(),
      },
    },
  });
}
