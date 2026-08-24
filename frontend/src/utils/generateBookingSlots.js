import {
  addMinutesToTime,
  timeToMinutes,
} from "./bookingTime";

export function generateBookingSlots(
  startTime,
  endTime,
  durationMinutes,
  intervalMinutes = 15
) {
  const slots = [];

  const openingMinutes = timeToMinutes(startTime);
  const closingMinutes = timeToMinutes(endTime);

  let currentStartMinutes = openingMinutes;

  while (currentStartMinutes + durationMinutes <= closingMinutes) {
    const slotStart = addMinutesToTime(
      startTime,
      currentStartMinutes - openingMinutes
    );

    const slotEnd = addMinutesToTime(
      slotStart,
      durationMinutes
    );

    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
    });

    currentStartMinutes += intervalMinutes;
  }

  return slots;
}

export function normalizeAvailabilityDay(dayAvailability) {
  if (!dayAvailability || typeof dayAvailability !== "object") {
    return {
      enabled: false,
      blocks: [],
    };
  }

  const enabled =
    typeof dayAvailability.enabled === "boolean"
      ? dayAvailability.enabled
      : Boolean(dayAvailability.isAvailable);

  const sourceBlocks = Array.isArray(dayAvailability.blocks)
    ? dayAvailability.blocks
    : dayAvailability.startTime && dayAvailability.endTime
      ? [
          {
            id: "default",
            startTime: dayAvailability.startTime,
            endTime: dayAvailability.endTime,
          },
        ]
      : [];

  return {
    enabled,
    blocks: sourceBlocks
      .filter((block) => block?.startTime && block?.endTime)
      .map((block, index) => ({
        id: block.id || `block-${index}`,
        startTime: block.startTime,
        endTime: block.endTime,
      })),
  };
}

export function generateBookingSlotsForAvailability(
  dayAvailability,
  durationMinutes,
  intervalMinutes = 15
) {
  const normalizedDay = normalizeAvailabilityDay(dayAvailability);

  if (!normalizedDay.enabled) {
    return [];
  }

  return normalizedDay.blocks.flatMap((block) =>
    generateBookingSlots(
      block.startTime,
      block.endTime,
      durationMinutes,
      intervalMinutes
    )
  );
}
