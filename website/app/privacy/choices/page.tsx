import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/PageHero";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "CutCare User Privacy Choices",
  description:
    "Learn how CutCare users can access, update, or delete account data and contact support about privacy questions.",
  openGraph: {
    title: "CutCare User Privacy Choices",
    description:
      "Information about accessing, changing, and deleting CutCare account data.",
    url: "/privacy/choices",
  },
};

export default function PrivacyChoicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Privacy Choices"
        title="User Privacy Choices"
        description="Learn how to access, update, delete, or ask questions about your CutCare account information."
      />

      <article className="legal-content mx-auto max-w-4xl px-5 py-12">
        <p>
          <strong>Last updated:</strong> {site.lastUpdated}
        </p>
        <p>
          This page explains the privacy choices currently available to CutCare
          users. It is intended for users who want to understand how to access,
          change, or delete information connected to their CutCare account.
        </p>

        <h2>Access Your Information</h2>
        <p>
          You can access much of your CutCare information directly in the app,
          including your account details, client or barber profile, bookings,
          messages, Hair Profile details, saved styles, and client notes where
          those features apply to your account.
        </p>

        <h2>Change Account or Profile Information</h2>
        <p>
          You can update editable profile details in the CutCare app. Depending on
          your account type, this may include your preferred name, client profile
          photo, barber business information, phone number, location, bio, services,
          accepted payment methods, availability, and portfolio images.
        </p>

        <h2>Delete Your Account</h2>
        <p>
          CutCare includes an in-app account deletion flow. Open CutCare, go to
          account settings, and choose Delete Account. The verified account deletion
          function deletes your Firebase Authentication user record, user document,
          relevant client or barber documents, related uploaded storage files, and
          client references from barber client lists where applicable.
        </p>

        <h2>Delete Photos, Notes, or Saved Information</h2>
        <p>
          Some information can be removed directly in the app, such as barber
          portfolio images, client notes, and saved styles. For other deletion
          questions, contact CutCare support.
        </p>

        <h2>AI and Hair Profile Information</h2>
        <p>
          CutCare AI features may use user-provided messages, recent session
          messages, uploaded hair photo references, and confirmed Hair Profile
          context when available. AI features are informational and are used for
          grooming, hairstyle, and barber-related guidance.
        </p>

        <h2>Contact About Privacy</h2>
        <p>
          <strong>
            <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
          </strong>
        </p>
        <p>
          Include your CutCare account email and a short description of the privacy
          request so support can review it.
        </p>

        <h2>Privacy Policy</h2>
        <p>
          Read the full{" "}
          <Link href="/privacy" className="font-bold text-cutcare-primary">
            CutCare Privacy Policy
          </Link>
          .
        </p>
      </article>
    </>
  );
}
