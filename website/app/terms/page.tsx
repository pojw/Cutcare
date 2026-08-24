import type { Metadata } from "next";

import { PageHero } from "@/components/PageHero";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "CutCare Terms of Use",
  description:
    "Terms of Use for CutCare, including user responsibilities, barber relationships, AI limitations, account termination, and liability.",
  openGraph: {
    title: "CutCare Terms of Use",
    description: "Terms governing use of CutCare.",
    url: "/terms",
  },
};

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Terms"
        title="CutCare Terms of Use"
        description="These terms describe the basic rules for using CutCare as a client or barber."
      />

      <article className="legal-content mx-auto max-w-4xl px-5 py-12">
        <p>
          <strong>Last updated:</strong> {site.lastUpdated}
        </p>
        <p>
          These Terms of Use govern access to and use of CutCare. By using CutCare,
          you agree to these terms.
        </p>
        <p>
          <strong>Contact:</strong>{" "}
          <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
        </p>

        <h2>About CutCare</h2>
        <p>
          CutCare helps clients and barbers connect, manage appointments, message,
          save hair-care context, and use informational AI-supported grooming and
          hairstyle features.
        </p>

        <h2>Accounts</h2>
        <p>
          You are responsible for keeping your account information accurate and for
          protecting access to your account. You must not use another person's account
          without permission or provide false, misleading, or unlawful information.
        </p>

        <h2>Clients and Barbers</h2>
        <p>
          Barbers on CutCare are independent service providers. CutCare does not employ
          barbers and does not guarantee the availability, quality, safety, legality,
          or outcome of barber services. Clients and barbers are responsible for their
          own communications, appointment details, and in-person service arrangements.
        </p>

        <h2>User Content</h2>
        <p>
          You are responsible for information, messages, photos, reviews, notes,
          profile details, portfolio images, and other content you submit. You must
          have the rights needed to submit that content, and you must not submit
          unlawful, harmful, deceptive, abusive, or infringing content.
        </p>

        <h2>Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use CutCare for unlawful, abusive, fraudulent, or harmful activity.</li>
          <li>Harass, threaten, impersonate, or mislead other users.</li>
          <li>Attempt to bypass security controls or access data you are not allowed to access.</li>
          <li>Upload malicious code or interfere with the operation of CutCare.</li>
          <li>Misuse messaging, reviews, booking tools, or AI features.</li>
        </ul>

        <h2>AI Features</h2>
        <p>
          CutCare may provide AI Hair Assistant and AI Hair Profile features. AI output
          is informational, may be incomplete or inaccurate, and should be reviewed
          carefully before relying on it.
        </p>
        <p>
          AI functionality does not provide medical diagnosis, medical treatment, or
          professional medical advice. For medical concerns, including scalp, skin,
          hair loss, injury, allergic reaction, or similar concerns, consult an
          appropriate professional.
        </p>

        <h2>Payments</h2>
        <p>
          The current codebase shows barber accepted payment methods as profile
          information, but does not show in-app payment processing, subscriptions, or
          marketplace payouts. Payment-specific terms should be added if CutCare later adds
          in-app payments, subscriptions, fees, refunds, or payout features.
        </p>

        <h2>Account Suspension or Termination</h2>
        <p>
          CutCare may suspend or terminate access if a user violates these terms,
          creates risk for other users, misuses the service, or if continued access
          would create legal, security, or operational concerns.
        </p>

        <h2>Intellectual Property</h2>
        <p>
          CutCare and its app design, branding, software, and related materials are
          owned by CutCare or its licensors. You may not copy, modify, distribute, or
          reverse engineer CutCare except as allowed by law or with written permission.
        </p>

        <h2>Disclaimers</h2>
        <p>
          CutCare is provided on an as-is and as-available basis. CutCare does not
          guarantee uninterrupted service, error-free operation, specific appointment
          availability, barber performance, or any particular result from using the app.
        </p>

        <h2>Limitation of Liability</h2>
        <p>
          To the maximum extent allowed by law, CutCare will not be liable for indirect,
          incidental, special, consequential, exemplary, or punitive damages, or for
          lost profits, lost data, personal injury, service disputes, or barber-client
          interactions arising from use of the app.
        </p>

        <h2>Changes to These Terms</h2>
        <p>
          CutCare may update these terms as the app changes. Updates will be posted on
          this page with a revised last updated date.
        </p>

        <h2>Contact</h2>
        <p>
          <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
        </p>
      </article>
    </>
  );
}
