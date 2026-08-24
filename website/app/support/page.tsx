import type { Metadata } from "next";

import { PageHero } from "@/components/PageHero";
import { Section } from "@/components/Section";
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

      <Section
        title="What We Can Help With"
        description="CutCare support can help with app access, client and barber workflows, account questions, and reports about app behavior."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <div
              key={category}
              className="rounded-lg border border-cutcare-border bg-white p-4 text-sm font-bold text-cutcare-ink"
            >
              {category}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Contact Support">
        <div className="rounded-lg border border-cutcare-border bg-white p-6">
          <p className="text-sm font-black uppercase tracking-[0.12em] text-cutcare-primary">
            Email support
          </p>
          <h2 className="mt-3 text-2xl font-black text-cutcare-ink">
            <a href={`mailto:${site.supportEmail}`} className="text-cutcare-primary">
              {site.supportEmail}
            </a>
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-cutcare-body">
            Include your CutCare account email, whether you are using a client or
            barber account, and a short description of the issue.
          </p>
        </div>
      </Section>

      <Section title="Account Deletion">
        <div className="rounded-lg border border-cutcare-border bg-white p-6">
          <p className="text-sm leading-7 text-cutcare-body">
            CutCare includes an in-app account deletion flow. Open the app, go to
            account settings, and choose Delete Account. For questions about deletion
            or privacy, use the support contact above.
          </p>
        </div>
      </Section>
    </>
  );
}
