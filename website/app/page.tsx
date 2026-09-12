import type { Metadata } from "next";

import { Section } from "@/components/Section";
import { SiteHeader } from "@/components/SiteHeader";

const pageDescription =
  "A resume project overview for CutCare, covering the problem, process, technical progress, and lessons behind the app build.";

export const metadata: Metadata = {
  title: "CutCare Project",
  description: pageDescription,
  openGraph: {
    title: "CutCare Project",
    description: pageDescription,
    url: "/",
  },
};

const processSteps = [
  {
    number: "01",
    title: "Upload Hair Photos",
    body: "The client adds front, side, and back photos so the app has enough visual context to understand their current hair.",
  },
  {
    number: "02",
    title: "Extract Hair Information",
    body: "The AI service checks image quality, analyzes each angle, and turns the photos into structured hair profile fields.",
  },
  {
    number: "03",
    title: "Confirm Hair Profile",
    body: "The client reviews the generated profile, corrects anything that looks off, and saves the confirmed hair information.",
  },
  {
    number: "04",
    title: "Retrieve Similar Haircut Knowledge",
    body: "The chatbot combines the user's question with the confirmed profile and retrieves relevant haircut knowledge using embeddings.",
  },
  {
    number: "05",
    title: "Create Personalized Recommendation",
    body: "The RAG response uses the user's hair profile and retrieved style context to suggest cuts, products, and barber-ready notes.",
  },
  {
    number: "06",
    title: "Save Completed Result",
    body: "The completed result stays connected to the client's profile so future recommendations can build from the same confirmed hair data.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <section
        id="project-overview"
        className="mx-auto max-w-6xl scroll-mt-24 px-6 pb-8 pt-12 text-center sm:px-10"
      >
        <div className="text-center">
          <h1 className="text-2xl font-semibold leading-tight tracking-normal text-cutcare-ink sm:text-3xl">
            Project Overview
          </h1>
          <div className="mx-auto mt-8 max-w-3xl rounded-lg border border-cutcare-border bg-white p-6 text-center shadow-sm">
            <p className="text-base leading-8 text-cutcare-body">
              CutCare is a personal full-stack project that turns barber
              scheduling, client messaging, and haircut preferences into one
              organized booking experience, making appointments easier to manage
              for barbers and easier to request for clients.
            </p>
          </div>
        </div>
      </section>

      <Section id="process" title="Process">
        <div className="mx-auto max-w-4xl rounded-lg border border-cutcare-border bg-white p-6 shadow-sm">
          <p className="mx-auto max-w-3xl text-center text-base leading-8 text-cutcare-body">
            The main technical process connects the hair analysis system to the
            recommendation chatbot. The app first gathers usable hair
            information from client photos, saves a confirmed profile, and then
            uses that profile during retrieval so the chatbot can return more
            specific recommendations.
          </p>

          <div className="relative mx-auto mt-8 max-w-3xl">
            <div className="absolute left-5 top-5 h-[calc(100%-2.5rem)] w-px bg-cutcare-primary/30 md:left-1/2 md:-translate-x-1/2" />
            <div className="grid gap-5">
              {processSteps.map((step, index) => (
                <div
                  key={step.number}
                  className={`relative grid gap-4 md:grid-cols-[1fr_3rem_1fr] md:items-center ${
                    index % 2 === 0 ? "" : "md:[&>*:first-child]:col-start-3"
                  }`}
                >
                  <div
                    className={`ml-14 rounded-lg border border-cutcare-border bg-cutcare-soft p-4 text-left md:ml-0 ${
                      index % 2 === 0
                        ? "md:col-start-1 md:text-right"
                        : "md:col-start-3"
                    }`}
                  >
                    <h3 className="text-base font-black text-cutcare-ink">
                      {step.number}. {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-cutcare-body">
                      {step.body}
                    </p>
                  </div>

                  <div className="absolute left-0 top-4 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-cutcare-primary text-sm font-black text-white shadow-sm md:static md:col-start-2 md:row-start-1">
                    {step.number}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section id="description" title="Description">
        <div className="mx-auto max-w-3xl rounded-lg border border-cutcare-border bg-white p-6 text-center shadow-sm">
          <p className="text-base leading-8 text-cutcare-body">
            CutCare is a personal project I built to show my ability to turn a
            real-life workflow problem into a working full-stack app. The goal of
            this page is not to sell the app, but to show the progress, design
            thinking, technical decisions, and implementation experience behind
            the project.
          </p>
          <p className="mt-5 text-base leading-8 text-cutcare-body">
            The project includes client and barber flows, booking management,
            messaging, notifications, profile data, and AI-assisted support. It
            also gave me practice dividing work across frontend, backend, and AI
            systems.
          </p>
        </div>
      </Section>

      <Section id="problem-statement" title="Problem Statement">
        <div className="mx-auto max-w-3xl rounded-lg border border-cutcare-border bg-white p-6 text-center shadow-sm">
          <p className="text-base leading-8 text-cutcare-body">
            While cutting hair at Purdue, managing appointments started to take
            up more time than expected. Between barber slots, Purdue meetings,
            going out with friends, and regular school responsibilities, it was
            easy to forget one thing or lose track of a booking detail.
          </p>
          <p className="mt-5 text-base leading-8 text-cutcare-body">
            Google Calendar helped with organization, but bookings still did not
            automatically transfer into the calendar. Each appointment had to be
            entered by hand, which created extra work and made mistakes more
            likely.
          </p>
          <p className="mt-5 text-base leading-8 text-cutcare-body">
            Another issue was answering the same customer questions over and
            over. A chatbot trained with the barber&apos;s own information,
            schedule, services, and booking rules could help customers get quick
            answers while reducing the amount of repetitive messaging.
          </p>
          <p className="mt-5 text-base leading-8 text-cutcare-body">
            I also wanted the app to respect how barbers actually work. Some
            customers need a quick shape-up, some need a longer appointment, and
            some need advice before they know what to book. CutCare was built
            around that real back-and-forth instead of treating every haircut as
            the same kind of calendar event.
          </p>
        </div>
      </Section>

      <Section id="full-results" title="Full Results">
        <div className="mx-auto max-w-3xl rounded-lg border border-cutcare-border bg-white p-6 text-center shadow-sm">
          <p className="text-base leading-8 text-cutcare-body">
            The strongest result is a working product foundation with separate
            client and barber experiences, account onboarding, barber search,
            booking management, messaging, notifications, profile details, and
            AI-assisted haircut support. The project gave me practice connecting
            mobile UI, Firebase data, cloud functions, and an AI service into
            one app flow.
          </p>
        </div>
      </Section>
    </>
  );
}
