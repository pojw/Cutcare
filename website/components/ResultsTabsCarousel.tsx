"use client";

import { useState } from "react";

type Audience = "client" | "barber";

type ResultScreen = {
  src: string;
  title: string;
  body: string;
};

const resultScreens: Record<Audience, ResultScreen[]> = {
  client: [
    {
      src: "/results/client-home.png",
      title: "Client Home",
      body: "A client dashboard with saved barbers, the next booking, notes, and core navigation.",
    },
    {
      src: "/results/client-booking.png",
      title: "Booking Flow",
      body: "A barber profile where clients choose services, review pricing, and start selecting an appointment.",
    },
    {
      src: "/results/client-upload-profile.png",
      title: "Hair Photo Upload",
      body: "A guided upload flow that asks for clear angles before the AI hair profile is generated.",
    },
    {
      src: "/results/client-hair-results.png",
      title: "Hair Results",
      body: "An editable review screen where clients can correct extracted hair details before saving.",
    },
    {
      src: "/results/client-hair-profile.png",
      title: "Saved Hair Profile",
      body: "The confirmed profile turns haircut context into reusable fields for future recommendations.",
    },
    {
      src: "/results/client-ai-assistant.png",
      title: "AI Hair Assistant",
      body: "A chat experience that can answer style, product, and barber-ready haircut questions.",
    },
  ],
  barber: [
    {
      src: "/results/barber-dashboard.png",
      title: "Barber Dashboard",
      body: "A daily view that combines calendar context, upcoming clients, notes, and quick actions.",
    },
    {
      src: "/results/barber-bookings.png",
      title: "Booking Management",
      body: "A bookings screen where barbers can filter appointments, message clients, and confirm or cancel requests.",
    },
    {
      src: "/results/barber-services.png",
      title: "Service Management",
      body: "Barbers can create, edit, and remove services with pricing, timing, and descriptions.",
    },
    {
      src: "/results/barber-availability.png",
      title: "Availability Tools",
      body: "Weekly scheduling controls let barbers manage slots and same-day booking rules.",
    },
  ],
};

const audiences: Audience[] = ["client", "barber"];

export function ResultsTabsCarousel() {
  const [audience, setAudience] = useState<Audience>("client");
  const [activeIndex, setActiveIndex] = useState(0);

  const screens = resultScreens[audience];
  const activeScreen = screens[activeIndex];

  function selectAudience(nextAudience: Audience) {
    setAudience(nextAudience);
    setActiveIndex(0);
  }

  function moveScreen(direction: "previous" | "next") {
    setActiveIndex((currentIndex) => {
      if (direction === "previous") {
        return currentIndex === 0 ? screens.length - 1 : currentIndex - 1;
      }

      return currentIndex === screens.length - 1 ? 0 : currentIndex + 1;
    });
  }

  return (
    <div className="rounded-lg border border-cutcare-border bg-white p-4 shadow-sm sm:p-6">
      <div className="mx-auto grid max-w-md grid-cols-2 rounded-lg bg-cutcare-soft p-1">
        {audiences.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => selectAudience(item)}
            className={`rounded-md px-4 py-3 text-sm font-semibold capitalize transition ${
              audience === item
                ? "bg-cutcare-primary text-white shadow-sm"
                : "text-cutcare-body hover:bg-white hover:text-cutcare-ink"
            }`}
            aria-pressed={audience === item}
          >
            {item}
          </button>
        ))}
      </div>

      <figure className="mt-6">
        <div className="grid grid-cols-[2.25rem_minmax(0,18rem)_2.25rem] items-center justify-center gap-2 sm:grid-cols-[3rem_minmax(0,20rem)_3rem] sm:gap-4">
          <button
            type="button"
            onClick={() => moveScreen("previous")}
            className="flex h-11 w-9 items-center justify-center rounded-md text-4xl font-normal leading-none text-cutcare-muted transition hover:bg-cutcare-mist hover:text-cutcare-primary sm:h-12 sm:w-12"
            aria-label="Show previous screenshot"
          >
            <span aria-hidden="true">&lsaquo;</span>
          </button>

          <div className="mx-auto w-full overflow-hidden rounded-lg border border-cutcare-border bg-cutcare-soft shadow-soft">
            <img
              src={activeScreen.src}
              alt={`${activeScreen.title} screen in the CutCare ${audience} app`}
              className="aspect-[1170/2532] w-full object-cover object-top"
            />
          </div>

          <button
            type="button"
            onClick={() => moveScreen("next")}
            className="flex h-11 w-9 items-center justify-center rounded-md text-4xl font-normal leading-none text-cutcare-muted transition hover:bg-cutcare-mist hover:text-cutcare-primary sm:h-12 sm:w-12"
            aria-label="Show next screenshot"
          >
            <span aria-hidden="true">&rsaquo;</span>
          </button>
        </div>

        <figcaption className="mx-auto mt-6 max-w-xl text-center">
          <h3 className="text-2xl font-semibold leading-tight text-cutcare-body sm:text-3xl">
            {activeScreen.title}
          </h3>
          <p className="mt-3 text-base leading-8 text-cutcare-body">
            {activeScreen.body}
          </p>
        </figcaption>
      </figure>

      <div className="mt-5 flex flex-wrap justify-center gap-2" aria-label="Screenshot list">
        {screens.map((screen, index) => (
          <button
            key={screen.src}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`h-2.5 rounded-full transition ${
              activeIndex === index
                ? "w-8 bg-cutcare-primary"
                : "w-2.5 bg-cutcare-border hover:bg-cutcare-muted"
            }`}
            aria-label={`Show ${screen.title}`}
            aria-current={activeIndex === index ? "true" : undefined}
          />
        ))}
      </div>
    </div>
  );
}
