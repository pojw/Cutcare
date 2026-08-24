import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { BrandMark } from "@/components/BrandMark";
import { Section } from "@/components/Section";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "CutCare",
  description:
    "CutCare helps clients discover barbers, book appointments, message their barber, and keep hair-care context organized.",
  openGraph: {
    title: "CutCare",
    description: site.description,
    url: "/",
  },
};

const featureCards = [
  {
    title: "Barber discovery",
    body: "Clients can search for barbers, review profiles, compare services, and see details that help them choose confidently.",
  },
  {
    title: "Appointment booking",
    body: "Clients request appointments while barbers manage booking status, availability, services, and client relationships.",
  },
  {
    title: "Messaging",
    body: "Clients and barbers can keep appointment details and follow-up conversations in one focused place.",
  },
  {
    title: "Hair Profiles",
    body: "Clients can save hair profile details and photos so future recommendations and barber conversations have better context.",
  },
];

const useCases = [
  "Find barbers and review their services, location, portfolio, and ratings.",
  "Request appointments and keep booking updates organized.",
  "Save hair notes, style links, and Hair Profile details for future visits.",
  "Ask the AI Hair Assistant for grooming, haircut, styling, and barber conversation guidance.",
];

const barberUseCases = [
  "Create a profile with business details, services, portfolio images, and accepted payment methods.",
  "Manage appointment requests and client communication.",
  "Keep private notes for client preferences and visit history.",
  "Use availability and calendar tools to stay organized.",
];

export default function Home() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-20">
        <div>
          <BrandMark />
          <h1 className="mt-8 max-w-3xl text-4xl font-black tracking-normal text-cutcare-ink md:text-6xl">
            Barber booking and hair-care context in one app.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-cutcare-body">
            CutCare helps clients discover barbers, request appointments, message
            their barber, and keep useful hair profile details ready for the next cut.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/support"
              className="rounded-full bg-cutcare-primary px-5 py-3 text-sm font-bold text-white shadow-soft transition hover:bg-cutcare-primaryPressed"
            >
              Get Support
            </Link>
            <Link
              href="/privacy"
              className="rounded-full border border-cutcare-border bg-white px-5 py-3 text-sm font-bold text-cutcare-ink transition hover:bg-cutcare-mist"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 rounded-[2rem] bg-cutcare-mist" />
          <div className="relative overflow-hidden rounded-[2rem] border border-cutcare-border bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between border-b border-cutcare-border pb-5">
              <div>
                <p className="text-sm font-bold text-cutcare-primary">Today</p>
                <p className="mt-1 text-2xl font-black text-cutcare-ink">
                  Ready for the next cut
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
            <div className="grid gap-4 py-5">
              {[
                ["Booking", "Appointment request sent"],
                ["Messages", "Share details before the visit"],
                ["Hair Profile", "Photos and preferences organized"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-lg border border-cutcare-border bg-cutcare-soft p-4"
                >
                  <span className="text-sm font-bold text-cutcare-body">{label}</span>
                  <span className="text-sm font-black text-cutcare-ink">{value}</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-cutcare-deep p-5 text-white">
              <p className="text-sm font-bold text-cyan-200">AI Hair Assistant</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                Personalized grooming and hairstyle guidance based on user-provided
                context. Informational only, never medical advice.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Section
        title="Built for the full appointment flow"
        description="CutCare keeps the practical parts of finding, booking, and returning to a barber close together."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {featureCards.map((feature) => (
            <article
              key={feature.title}
              className="rounded-lg border border-cutcare-border bg-white p-5 shadow-sm"
            >
              <h3 className="text-lg font-black text-cutcare-ink">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-cutcare-body">{feature.body}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section title="For clients and barbers">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-cutcare-border bg-white p-6">
            <h3 className="text-xl font-black text-cutcare-ink">Clients</h3>
            <ul className="mt-5 space-y-3">
              {useCases.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-cutcare-body">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cutcare-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-cutcare-border bg-white p-6">
            <h3 className="text-xl font-black text-cutcare-ink">Barbers</h3>
            <ul className="mt-5 space-y-3">
              {barberUseCases.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-cutcare-body">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cutcare-green" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section
        title="AI features with clear boundaries"
        description="The AI Hair Assistant and Hair Profile features are designed to support everyday grooming and barber conversations."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            "Uses user-provided messages and Hair Profile context when available.",
            "Can suggest questions, care routines, style ideas, and ways to explain preferences.",
            "Does not diagnose medical conditions or replace a licensed professional.",
          ].map((item) => (
            <div key={item} className="rounded-lg bg-cutcare-mist p-5 text-sm font-semibold leading-6 text-cutcare-ink">
              {item}
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
