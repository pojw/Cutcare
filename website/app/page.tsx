import type { Metadata } from "next";

import { ProcessTabsCarousel } from "@/components/ProcessTabsCarousel";
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

export default function Home() {
  return (
    <>
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 pb-8 pt-12 text-center sm:px-10">
        <div className="text-center">
          <h1 className="text-3xl font-semibold leading-tight tracking-normal text-cutcare-ink sm:text-4xl">
            Project Overview
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-cutcare-body">
            CutCare is a personal full-stack project that turns barber
            scheduling, client messaging, and haircut preferences into one
            organized booking experience, making appointments easier to manage
            for barbers and easier to request for clients.
          </p>
        </div>
      </section>

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

      <Section id="process" title="Process">
        <div className="mx-auto max-w-3xl rounded-lg border border-cutcare-border bg-white p-6 text-center shadow-sm">
          <p className="text-base leading-8 text-cutcare-body">
            I started by mapping the two main users: clients who need a simple
            way to request a cut, and barbers who need control over their time,
            services, and communication. That helped me separate the app into
            client screens, barber screens, shared booking logic, and account
            setup.
          </p>
          <p className="mt-5 text-base leading-8 text-cutcare-body">
            After the core screens were in place, I focused on the systems that
            made the app useful: booking requests, barber availability,
            messaging, notifications, saved client notes, and calendar support.
            Each feature was built around reducing the manual work that usually
            happens through texts and separate calendar entries.
          </p>
          <p className="mt-5 text-base leading-8 text-cutcare-body">
            The AI work came after that foundation. I connected chat responses
            to haircut profile context and started building a small knowledge
            base of styles, descriptions, and reasons someone might choose each
            cut. That gave the assistant more useful context when answering
            grooming questions or helping a client think through a style.
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

      <Section id="client-barber" title="Client and Barber Views">
        <ProcessTabsCarousel />
      </Section>
    </>
  );
}
