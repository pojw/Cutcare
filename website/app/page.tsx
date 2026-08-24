import type { Metadata } from "next";
import Image from "next/image";

import { ProcessTabsCarousel } from "@/components/ProcessTabsCarousel";
import { Section } from "@/components/Section";

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
      <section className="mx-auto max-w-5xl px-5 pb-12 pt-14 md:pb-16 md:pt-20">
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-normal text-cutcare-ink md:text-6xl">
            Project Overview
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-cutcare-body">
            A personal software project documenting how I planned, built, and
            iterated on a barber booking app while solving a real scheduling
            problem from my own experience.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-[2rem] border border-cutcare-border bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between border-b border-cutcare-border pb-4">
            <div>
              <p className="text-sm font-bold text-cutcare-primary">
                Project image placeholder
              </p>
              <p className="mt-1 text-2xl font-black text-cutcare-ink">
                Actual app picture coming soon
              </p>
            </div>
            <Image
              src="/logo-glow.png"
              alt=""
              width={72}
              height={72}
              className="rounded-2xl"
              priority
            />
          </div>
          <div className="mt-5 flex aspect-[9/16] min-h-[32rem] items-center justify-center rounded-2xl border border-dashed border-cutcare-primary/40 bg-cutcare-soft p-6 text-center">
            <div>
              <p className="text-2xl font-black text-cutcare-ink">
                CutCare app screenshot
              </p>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-cutcare-body">
                Placeholder for a real screen from the project, used to show
                progress and implementation work.
              </p>
            </div>
          </div>
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
            systems while building toward an MVP.
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
        </div>
      </Section>

      <Section id="process" title="Process">
        <div className="grid gap-6">
          <div className="mx-auto max-w-3xl rounded-lg border border-cutcare-border bg-white p-6 text-center shadow-sm">
            <p className="text-base leading-8 text-cutcare-body">
              I started by imagining the overall structure of the app and
              writing down the requirements it needed to meet. From there, I
              divided the work into frontend and backend/AI parts so both sides
              could be built in parallel and reach a working MVP as quickly as
              possible.
            </p>
            <p className="mt-5 text-base leading-8 text-cutcare-body">
              Once the basic frontend information was on screen, I focused on
              the backend systems that made the app feel real: messaging,
              booking, and notifications. After that foundation was in place, I
              came back for a frontend UI pass so the screens could start moving
              from placeholders toward a clearer portfolio-ready project demo.
            </p>
            <p className="mt-5 text-base leading-8 text-cutcare-body">
              On the AI side, I started building the RAG system by taking the
              user&apos;s chatbot query, adding useful haircut profile context,
              and sending that to the chatbot so it could return a stronger
              response. Then I added a small knowledge base with common cuts,
              reasons someone might choose them, and descriptions of each style.
              The user&apos;s message can be vectorized and compared against that
              knowledge base, giving the chatbot relevant context that reflects
              my own haircut knowledge.
            </p>
          </div>

          <div className="mx-auto max-w-3xl rounded-lg border border-cutcare-border bg-white p-5 shadow-sm">
            <div className="flex min-h-[16rem] items-center justify-center rounded-lg border border-dashed border-cutcare-primary/40 bg-cutcare-soft p-6 text-center">
              <div>
                <p className="text-2xl font-black text-cutcare-ink">
                  Process image placeholder
                </p>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-cutcare-body">
                  Future space for a workflow image, architecture sketch, or app
                  build screenshot.
                </p>
              </div>
            </div>
          </div>

          <ProcessTabsCarousel />
        </div>
      </Section>

      <Section id="full-results" title="Full Results">
        <div className="mx-auto max-w-3xl rounded-lg border border-cutcare-border bg-white p-6 text-center shadow-sm">
          <p className="text-base leading-8 text-cutcare-body">
            Placeholder for the final results section. This can later include
            completed screens, what worked, what changed, and the strongest
            technical outcomes from the CutCare MVP.
          </p>
        </div>
      </Section>
    </>
  );
}
