"use client";
import React from "react";
import Link from "next/link";
import Footer from "@/components/footer";

export const dynamic = "force-static";

const LAST_UPDATED = "June 13, 2026";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--backgroundColor)] text-[var(--textColor)]">
      <header className="px-8 py-4 shadow-md bg-[var(--backgroundColor)] sticky top-0 z-50">
        <Link href="/" className="text-3xl font-bold">
          Paw<span className="primary">Gle</span>
        </Link>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2 text-[var(--primaryColor)]">
          Privacy Policy
        </h1>
        <p className="text-sm text-[var(--textColor2)] mb-10">
          Last updated: {LAST_UPDATED}
        </p>

        <section className="space-y-6 leading-relaxed">
          <p>
            This Privacy Policy describes how PawGle (&ldquo;we&rdquo;,
            &ldquo;us&rdquo;, &ldquo;our&rdquo;) collects, uses, and protects
            your information when you use the PawGle website and services
            (the &ldquo;Service&rdquo;).
          </p>

          <h2 className="text-2xl font-semibold text-[var(--primaryColor)]">
            1. Information We Collect
          </h2>
          <p>
            When you create an account or sign in with Google, we collect:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Your name and email address.</li>
            <li>
              Your Google profile information (name, email, profile picture)
              if you choose to sign in with Google.
            </li>
            <li>
              Pet information you choose to upload, including pet name, type,
              breed, photos, and (optionally) location data when you report a
              lost or found pet.
            </li>
            <li>
              Basic usage information such as log entries and timestamps that
              help us operate and secure the Service.
            </li>
          </ul>

          <h2 className="text-2xl font-semibold text-[var(--primaryColor)]">
            2. How We Use Your Information
          </h2>
          <ul className="list-disc ml-6 space-y-1">
            <li>To create and manage your account and authenticate you.</li>
            <li>
              To run pet recognition: extract feature vectors from uploaded
              images and compare them with other pets in our database.
            </li>
            <li>
              To help reunite lost pets with their owners via the lost &
              found map and the secure owner-to-reporter messaging relay.
            </li>
            <li>
              To send you transactional emails (account verification,
              password reset, replies routed through the platform, and
              notifications related to your pets).
            </li>
            <li>To improve, monitor, and secure the Service.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-[var(--primaryColor)]">
            3. Google Sign-In
          </h2>
          <p>
            When you choose to sign in with Google, we use Google Identity
            Services to verify your identity. We only request the basic
            scopes <code>openid</code>, <code>email</code>, and
            <code> profile</code>. We do not access your Gmail, contacts,
            calendar, Drive, or any other Google data. Google&apos;s use of
            information received from these scopes is governed by
            Google&apos;s privacy policy.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--primaryColor)]">
            4. How We Share Information
          </h2>
          <p>
            We do not sell your personal information. We share information
            only in these limited cases:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>
              <strong>With other users you choose to contact:</strong> if you
              report a lost or found pet, the public listing shows the pet
              details and approximate location. Your email is not displayed;
              messages are relayed through our system.
            </li>
            <li>
              <strong>Service providers we rely on to operate PawGle</strong>{" "}
              (TiDB Cloud for the database, Cloudflare R2 for image storage,
              Resend for transactional email, and a hosted machine-learning
              endpoint for pet feature extraction). These providers process
              data only on our behalf.
            </li>
            <li>
              <strong>Legal compliance:</strong> when required by law, valid
              legal process, or to protect the rights and safety of users.
            </li>
          </ul>

          <h2 className="text-2xl font-semibold text-[var(--primaryColor)]">
            5. Data Retention
          </h2>
          <p>
            We retain your account information for as long as your account
            is active. You can request deletion of your account and the pets
            you have registered at any time by contacting us.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--primaryColor)]">
            6. Security
          </h2>
          <p>
            We use industry-standard measures to protect your information,
            including encrypted database connections, signed image URLs, and
            JWT-based authentication. No system is perfectly secure, so we
            cannot guarantee absolute security.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--primaryColor)]">
            7. Your Rights
          </h2>
          <p>
            You can access and update your profile, edit or delete pets you
            have registered, and request full account deletion at any time.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--primaryColor)]">
            8. Children&apos;s Privacy
          </h2>
          <p>
            PawGle is not directed at children under 13, and we do not
            knowingly collect personal information from them.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--primaryColor)]">
            9. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. We will
            update the &ldquo;Last updated&rdquo; date above and, when
            appropriate, notify you in-app or by email.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--primaryColor)]">
            10. Contact
          </h2>
          <p>
            For privacy questions or data requests, contact us at{" "}
            <a
              className="text-[var(--primaryColor)] underline"
              href="mailto:support@neokit.app"
            >
              support@neokit.app
            </a>
            .
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
