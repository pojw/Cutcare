import type { Metadata } from "next";

import { PageHero } from "@/components/PageHero";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "CutCare Support",
  description:
    "Get help with CutCare accounts, bookings, messaging, Hair Profiles, AI Hair Assistant, barber questions, bugs, privacy, and account deletion.",
  openGraph: {
    title: "CutCare Support",
    description:
      "Support information for CutCare clients, barbers, and App Store review.",
    url: "/support",
  },
};

const categories = [
  "Account issues",
  "Booking issues",
  "Messaging",
  "Hair Profile",
  "AI Hair Assistant",
  "Barber account questions",
  "Bug reports",
  "Privacy and account deletion questions",
];

export default function SupportPage() {
  return (
    <>
      <PageHero
        eyebrow="Support"
        title="CutCare Support"
        description="This page is the public support resource for CutCare users and is suitable for the App Store support URL."
      />

      <section className="mx-auto max-w-4xl px-6 py-12 sm:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-cutcare-primary">
              What we can help with
            </p>
            <h2 className="mt-3 text-2xl font-semibold leading-tight text-cutcare-ink sm:text-3xl">
              App access, bookings, profiles, and account questions.
            </h2>
            <p className="mt-4 text-base leading-8 text-cutcare-body">
              CutCare support can help with app access, client and barber
              workflows, account questions, and reports about app behavior.
            </p>

            <ul className="mt-6 divide-y divide-cutcare-border border-y border-cutcare-border">
              {categories.map((category) => (
                <li
                  key={category}
                  className="flex items-center justify-between gap-4 py-3 text-sm font-semibold text-cutcare-ink"
                >
                  <span>{category}</span>
                  <span className="h-2 w-2 rounded-full bg-cutcare-primary/70" />
                </li>
              ))}
            </ul>
          </div>

          <aside className="rounded-lg border border-cutcare-border bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-cutcare-primary">
              Email support
            </p>
            <h2 className="mt-3 break-words text-xl font-semibold text-cutcare-ink sm:text-2xl">
              <a href={`mailto:${site.supportEmail}`} className="text-cutcare-primary">
                {site.supportEmail}
              </a>
            </h2>
            <p className="mt-4 text-sm leading-7 text-cutcare-body">
              Include your CutCare account email, whether you are using a client or
              barber account, and a short description of the issue.
            </p>
          </aside>
        </div>

        <div className="mt-10 rounded-lg border border-cutcare-border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-cutcare-ink">
            Account deletion
          </h2>
          <p className="mt-3 text-sm leading-7 text-cutcare-body">
            CutCare includes an in-app account deletion flow. Open the app, go to
            account settings, and choose Delete Account. For questions about deletion
            or privacy, use the support contact above.
          </p>
        </div>
      </section>
    </>
  );
}
