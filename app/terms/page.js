"use client";
import React from "react";
import Link from "next/link";
import Footer from "@/components/footer";

export const dynamic = "force-static";

const LAST_UPDATED = "June 13, 2026";

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--backgroundColor)] text-[var(--textColor)]">
      <header className="px-8 py-4 shadow-md bg-[var(--backgroundColor)] sticky top-0 z-50">
        <Link href="/" className="text-3xl font-bold">
          Paw<span className="primary">Gle</span>
        </Link>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2 text-[var(--primaryColor)]">
          Terms of Service
        </h1>
        <p className="text-sm text-[var(--textColor2)] mb-10">
          Last updated: {LAST_UPDATED}
        </p>

        <section className="space-y-6 leading-relaxed">
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access
            to and use of PawGle (the &ldquo;Service&rdquo;). By using the
            Service you agree to these Terms.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--primaryColor)]">
            1. Eligibility & Accounts
          </h2>
          <p>
            You must be at least 13 years old to use PawGle. You are
            responsible for maintaining the confidentiality of your account
            credentials and for all activity that occurs under your account.
            You may sign in with email and password or with Google.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--primaryColor)]">
            2. Your Content
          </h2>
          <p>
            You retain ownership of any content you upload, including pet
            photos, names, and descriptions (&ldquo;Your Content&rdquo;). By
            uploading Your Content, you grant PawGle a non-exclusive,
            worldwide, royalty-free license to host, store, reproduce, and
            display it as needed to operate the Service (for example, to
            extract feature vectors, run similarity matching, and show your
            pet on the lost &amp; found map when you choose to publish it).
          </p>
          <p>
            You represent that you have the right to upload Your Content and
            that it does not violate any third-party rights or applicable
            law.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--primaryColor)]">
            3. Acceptable Use
          </h2>
          <p>You agree not to use the Service to:</p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Upload content you do not have the right to share.</li>
            <li>
              Harass, abuse, impersonate, or harm other users, including by
              sending unsolicited messages through the contact-owner relay.
            </li>
            <li>
              Submit false lost-or-found reports, or use the Service to
              locate or identify pets you have no legitimate interest in.
            </li>
            <li>
              Attempt to bypass authentication, scrape data at scale,
              reverse-engineer the AI models, or otherwise abuse the
              Service.
            </li>
            <li>
              Upload malicious files or attempt to compromise the security
              of PawGle or other users.
            </li>
          </ul>

          <h2 className="text-2xl font-semibold text-[var(--primaryColor)]">
            4. AI Recognition Disclaimer
          </h2>
          <p>
            PawGle uses machine learning to compare pet images and suggest
            possible matches. Matches are probabilistic and may be wrong.
            You should always verify a pet&apos;s identity in person before
            taking action based on a match.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--primaryColor)]">
            5. Lost &amp; Found Reports
          </h2>
          <p>
            Information you choose to publish in a lost or found report
            (such as pet name, photo, approximate location, and contact
            preferences) becomes visible to other users. We relay messages
            between you and other users through our system and do not share
            your email unless both parties agree to share contact details.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--primaryColor)]">
            6. Account Termination
          </h2>
          <p>
            You can delete your account at any time. We may suspend or
            terminate accounts that violate these Terms, that are inactive
            for long periods, or where required by law.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--primaryColor)]">
            7. Service &ldquo;As Is&rdquo;
          </h2>
          <p>
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as
            available&rdquo;, without warranties of any kind. We do not
            guarantee that the Service will be uninterrupted, error-free, or
            that the AI matches will be accurate.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--primaryColor)]">
            8. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by law, PawGle and its
            contributors will not be liable for any indirect, incidental,
            special, consequential, or punitive damages, or any loss of
            data, profits, or goodwill, arising out of your use of the
            Service.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--primaryColor)]">
            9. Changes to These Terms
          </h2>
          <p>
            We may update these Terms from time to time. We will update the
            &ldquo;Last updated&rdquo; date above and, when appropriate,
            notify you in-app or by email. Continued use of the Service
            after changes means you accept the updated Terms.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--primaryColor)]">
            10. Contact
          </h2>
          <p>
            Questions about these Terms? Contact us at{" "}
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

export default TermsOfService;
