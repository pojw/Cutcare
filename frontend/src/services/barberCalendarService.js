import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../config/firebase";

export const CALENDAR_COLOR_OPTIONS = [
  {
    id: "blue",
    background: "#E8F2FF",
    border: "#1677FF",
    text: "#0B1F3A",
  },
  {
    id: "indigo",
    background: "#EEF2FF",
    border: "#6366F1",
    text: "#1E1B4B",
  },
  {
    id: "green",
    background: "#ECFDF3",
    border: "#22A06B",
    text: "#064E3B",
  },
  {
    id: "amber",
    background: "#FFF7E8",
    border: "#E69B19",
    text: "#5F3B00",
  },
  {
    id: "slate",
    background: "#F3F7FB",
    border: "#8292A6",
    text: "#0B1F3A",
  },
  {
    id: "rose",
    background: "#FFF1F2",
    border: "#F43F5E",
    text: "#881337",
  },
  {
    id: "violet",
    background: "#F5F3FF",
    border: "#8B5CF6",
    text: "#2E1065",
  },
  {
    id: "cyan",
    background: "#ECFEFF",
    border: "#06B6D4",
    text: "#164E63",
  },
  {
    id: "lime",
    background: "#F7FEE7",
    border: "#84CC16",
    text: "#365314",
  },
  {
    id: "orange",
    background: "#FFF7ED",
    border: "#F97316",
    text: "#7C2D12",
  },
  {
    id: "pink",
    background: "#FDF2F8",
    border: "#EC4899",
    text: "#831843",
  },
  {
    id: "teal",
    background: "#F0FDFA",
    border: "#14B8A6",
    text: "#134E4A",
  },
  {
    id: "red",
    background: "#FEF2F2",
    border: "#EF4444",
    text: "#7F1D1D",
  },
  {
    id: "yellow",
    background: "#FEFCE8",
    border: "#EAB308",
    text: "#713F12",
  },
  {
    id: "purple",
    background: "#FAF5FF",
    border: "#A855F7",
    text: "#581C87",
  },
];

export const BOOKING_CALENDAR_TYPES = [
  {
    id: "booking_pending",
    name: "Pending",
    color: {
      background: "#FFF7E8",
      border: "#E69B19",
      text: "#5F3B00",
    },
  },
  {
    id: "booking_confirmed",
    name: "Confirmed",
    color: {
      background: "#E8F2FF",
      border: "#1677FF",
      text: "#0B1F3A",
    },
  },
];

export const DEFAULT_CALENDAR_TYPES = [
  {
    id: "class",
    name: "Class",
    color: CALENDAR_COLOR_OPTIONS[1],
  },
  {
    id: "study",
    name: "Study",
    color: CALENDAR_COLOR_OPTIONS[2],
  },
  {
    id: "workout",
    name: "Workout",
    color: CALENDAR_COLOR_OPTIONS[0],
  },
  {
    id: "personal",
    name: "Personal",
    color: CALENDAR_COLOR_OPTIONS[3],
  },
];

function buildCalendarInfoRef(barberId) {
  return doc(db, "barbers", barberId, "calendar", "settings");
}

export function normalizeCalendarInfo(value = {}) {
  const savedTypes = Array.isArray(value.eventTypes) ? value.eventTypes : [];
  const mergedTypes = [...DEFAULT_CALENDAR_TYPES];

  savedTypes.forEach((type) => {
    if (!type?.id || !type?.name || !type?.color) {
      return;
    }

    const existingIndex = mergedTypes.findIndex(
      (defaultType) => defaultType.id === type.id
    );

    if (existingIndex >= 0) {
      mergedTypes[existingIndex] = type;
      return;
    }

    mergedTypes.push(type);
  });

  return {
    eventTypes: mergedTypes,
    events: Array.isArray(value.events) ? value.events : [],
  };
}

export async function getBarberCalendarInfo(barberId) {
  if (!barberId) {
    throw new Error("Barber ID is required.");
  }

  const calendarSnap = await getDoc(buildCalendarInfoRef(barberId));

  if (!calendarSnap.exists()) {
    return normalizeCalendarInfo();
  }

  return normalizeCalendarInfo(calendarSnap.data());
}

export async function saveBarberCalendarInfo(barberId, calendarInfo) {
  if (!barberId) {
    throw new Error("Barber ID is required.");
  }

  const normalizedInfo = normalizeCalendarInfo(calendarInfo);

  await setDoc(
    buildCalendarInfoRef(barberId),
    {
      eventTypes: normalizedInfo.eventTypes,
      events: normalizedInfo.events,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return normalizedInfo;
}
