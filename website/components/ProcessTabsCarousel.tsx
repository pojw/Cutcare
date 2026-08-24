"use client";

import { useMemo, useState } from "react";

type Audience = "client" | "barber";

const slides: Record<Audience, { title: string; body: string }[]> = {
  client: [
    {
      title: "Client placeholder 01",
      body: "Future space for the screen where customers discover the barber, review details, and begin booking.",
    },
    {
      title: "Client placeholder 02",
      body: "Future space for appointment requests, saved haircut context, and messages before the visit.",
    },
    {
      title: "Client placeholder 03",
      body: "Future space for AI guidance, haircut profile details, and follow-up information.",
    },
  ],
  barber: [
    {
      title: "Barber placeholder 01",
      body: "Future space for managing available slots, service details, and booking requests.",
    },
    {
      title: "Barber placeholder 02",
      body: "Future space for messaging, customer notes, and repeated-question support.",
    },
    {
      title: "Barber placeholder 03",
      body: "Future space for calendar organization, notifications, and shop workflow tools.",
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
          <h3 className="mt-4 text-2xl font-black text-cutcare-ink">
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
