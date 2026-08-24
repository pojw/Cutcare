import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/PageHero";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "CutCare Privacy Policy",
  description:
    "Privacy Policy for CutCare, including account data, bookings, messages, photos, AI features, retention, deletion, and service providers.",
  openGraph: {
    title: "CutCare Privacy Policy",
    description: "Privacy information for CutCare users.",
    url: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Privacy"
        title="CutCare Privacy Policy"
        description="This policy explains what CutCare collects, how the app uses information, and what is currently verified from the codebase."
      />

      <article className="legal-content mx-auto max-w-4xl px-5 py-12">
        <p>
          <strong>Last updated:</strong> {site.lastUpdated}
        </p>
        <p>
          This Privacy Policy applies to CutCare, a mobile app for clients and
          barbers. CutCare helps users discover barbers, manage appointments,
          message, save hair-care context, and use AI-supported hair profile and
          grooming guidance features.
        </p>
        <p>
          <strong>Contact:</strong>{" "}
          <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
        </p>

        <h2>Information We Collect</h2>
        <p>Based on the current CutCare codebase, the app may collect:</p>
        <ul>
          <li>
            <strong>Account information:</strong> name, email address, password
            credentials handled by Firebase Authentication, account role, onboarding
            status, and related account settings.
          </li>
          <li>
            <strong>Client profile information:</strong> preferred name, location,
            optional profile photo, favorite barbers, client notes, and saved style
            links.
          </li>
          <li>
            <strong>Barber profile information:</strong> business name, phone number,
            location, bio, services, specialties, accepted payment methods,
            availability, profile image, portfolio images, ratings, and review count.
          </li>
          <li>
            <strong>Appointment and booking information:</strong> client and barber
            identifiers, appointment date and time, booking status, service details,
            and cancellation or completion updates.
          </li>
          <li>
            <strong>Messages and reviews:</strong> conversation metadata, message text,
            sender information, review ratings, and review comments.
          </li>
          <li>
            <strong>Photos and Hair Profile information:</strong> user-uploaded client
            profile photos, barber profile and portfolio photos, hair profile photos,
            photo metadata, AI-generated profile output, and user-confirmed Hair
            Profile details.
          </li>
          <li>
            <strong>AI-related inputs:</strong> AI chat messages, recent session
            messages sent with a request, client ID, uploaded hair photo references,
            photo angles, and confirmed Hair Profile context when available.
          </li>
          <li>
            <strong>Technical and service data:</strong> Firebase identifiers, Expo
            push notification tokens, platform information, timestamps, cloud function
            logs, API request data, and service diagnostics needed to operate the app.
          </li>
        </ul>

        <h2>How We Use Information</h2>
        <p>CutCare uses information to:</p>
        <ul>
          <li>Create and maintain client and barber accounts.</li>
          <li>Show barber profiles, services, locations, reviews, and portfolio images.</li>
          <li>Support appointment booking, cancellation, completion, and notifications.</li>
          <li>Enable messaging between clients and barbers.</li>
          <li>Store client notes, saved styles, Hair Profiles, and uploaded photos.</li>
          <li>Provide AI Hair Assistant responses and AI Hair Profile analysis.</li>
          <li>Improve reliability, security, debugging, and abuse prevention.</li>
        </ul>

        <h2>AI Features</h2>
        <p>
          CutCare includes AI-supported features for hair-care, grooming, hairstyle,
          and barber-related guidance. AI chat requests may include the user message,
          recent session messages, client ID, and confirmed Hair Profile context if a
          confirmed profile exists. AI Hair Profile analysis may process uploaded hair
          photos and related metadata.
        </p>
        <p>
          AI output is informational and may be inaccurate. CutCare AI features do not
          diagnose medical conditions, do not provide medical advice, and should not be
          used as a substitute for advice from a qualified professional.
        </p>

        <h2>Photos and Hair Profiles</h2>
        <p>
          Users may upload profile photos, barber portfolio photos, and Hair Profile
          photos. Hair Profile photos are uploaded to Firebase Storage and referenced
          by the AI service for analysis. The AI service stores generated profile data
          under the client Hair Profiles collection when profile storage is enabled.
        </p>

        <h2>Data Sharing</h2>
        <p>
          CutCare uses third-party service providers to operate the app. Verified
          providers in the current codebase include Firebase and Google Cloud services,
          Expo push notification services, and OpenAI-powered AI functionality through
          the CutCare AI service.
        </p>
        <p>
          Some user profile, barber profile, booking, review, and conversation data is
          visible to other signed-in users where needed for app functionality. Private
          client notes, saved styles, notifications, push tokens, and Hair Profiles are
          protected by Firestore rules for the relevant owner account.
        </p>
        <p>
          The current codebase does not show separate analytics or crash reporting
          providers beyond the app services described above. If CutCare adds
          analytics, crash reporting, monitoring, advertising, or additional service
          providers, this policy should be updated before those features are used.
        </p>

        <h2>Data Retention</h2>
        <p>
          CutCare retains account, profile, booking, message, review, photo, and AI
          profile data for as long as needed to provide the app and maintain user
          records, unless the user deletes their account or asks for deletion where
          available.
        </p>

        <h2>Account Deletion</h2>
        <p>
          CutCare includes an in-app account deletion function. The verified function
          deletes the user authentication record, user document, relevant client or
          barber documents, related Firebase Storage prefixes, and client references
          from barber client lists where applicable.
        </p>
        <p>
          Some information may remain where deletion is not technically possible or
          where retention is required for security, legal, or operational reasons.
        </p>
        <p>
          For a user-facing summary of privacy choices, see{" "}
          <Link href="/privacy/choices" className="font-bold text-cutcare-primary">
            User Privacy Choices
          </Link>
          .
        </p>

        <h2>Security</h2>
        <p>
          CutCare uses Firebase Authentication, Firestore security rules, Firebase
          Storage, authenticated API requests, and cloud service controls to help
          protect user information. No system can be guaranteed completely secure.
        </p>

        <h2>Children's Privacy</h2>
        <p>
          CutCare is not intended for children under 13. If you believe a child has
          provided personal information through CutCare, contact CutCare support.
        </p>

        <h2>Changes to This Policy</h2>
        <p>
          CutCare may update this Privacy Policy as the app changes. Updates will be
          posted on this page with a revised last updated date.
        </p>

        <h2>Contact</h2>
        <p>
          <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>
        </p>
      </article>
    </>
  );
}
