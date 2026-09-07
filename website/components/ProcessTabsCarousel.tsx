"use client";

import { useMemo, useState } from "react";

type Audience = "client" | "barber";

const slides: Record<Audience, { title: string; body: string }[]> = {
  client: [
    {
      title: "Discover a barber",
      body: "Clients can search for a barber, review profile details, compare services, and start a booking from one focused flow.",
    },
    {
      title: "Request an appointment",
      body: "The booking flow keeps the service, time, barber, and client details together so the request is easier to track.",
    },
    {
      title: "Use haircut context",
      body: "Saved styles, Hair Profile details, and AI guidance help clients explain what they want before they sit in the chair.",
    },
  ],
  barber: [
    {
      title: "Manage availability",
      body: "Barbers can set services, availability, and booking rules so clients see clearer options before reaching out.",
    },
    {
      title: "Keep client details close",
      body: "Messages, client notes, and booking history give the barber a cleaner way to remember what each client needs.",
    },
    {
      title: "Reduce manual follow-up",
      body: "Notifications, booking updates, and calendar support reduce the extra reminders and repeated questions around each appointment.",
    },
  ],
};

export function ProcessTabsCarousel() {
  const [audience, setAudience] = useState<Audience>("client");
  const [activeIndex, setActiveIndex] = useState(0);

  const activeSlides = slides[audience];
  const activeSlide = activeSlides[activeIndex];

  const progressLabel = useMemo(
    () => `${activeIndex + 1} / ${activeSlides.length}`,
    [activeIndex, activeSlides.length],
  );

  function selectAudience(nextAudience: Audience) {
    setAudience(nextAudience);
    setActiveIndex(0);
  }

  function moveSlide(direction: "previous" | "next") {
    setActiveIndex((currentIndex) => {
      if (direction === "previous") {
        return currentIndex === 0 ? activeSlides.length - 1 : currentIndex - 1;
      }

      return currentIndex === activeSlides.length - 1 ? 0 : currentIndex + 1;
    });
  }

  return (
    <div className="mx-auto max-w-3xl rounded-lg border border-cutcare-border bg-white p-5 text-center shadow-sm">
      <div className="flex flex-wrap justify-center gap-2">
        {(["client", "barber"] as Audience[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => selectAudience(item)}
            className={`rounded-full px-4 py-2 text-sm font-black capitalize transition ${
              audience === item
                ? "bg-cutcare-primary text-white"
                : "border border-cutcare-border bg-white text-cutcare-body hover:bg-cutcare-mist hover:text-cutcare-ink"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-5 flex min-h-[18rem] items-center justify-center rounded-lg border border-dashed border-cutcare-primary/40 bg-cutcare-soft p-6 text-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-cutcare-primary">
            {progressLabel}
          </p>
          <h3 className="mt-4 text-xl font-semibold text-cutcare-ink sm:text-2xl">
            {activeSlide.title}
          </h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-cutcare-body">
            {activeSlide.body}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => moveSlide("previous")}
          className="rounded-full border border-cutcare-border bg-white px-4 py-2 text-sm font-black text-cutcare-body transition hover:bg-cutcare-mist hover:text-cutcare-ink"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => moveSlide("next")}
          className="rounded-full bg-cutcare-deep px-4 py-2 text-sm font-black text-white transition hover:bg-cutcare-primaryPressed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
