"use client";

/**
 * Magic-link auth page.
 *
 * Two modes determined by the query string:
 *   - ?token=<signed>  -> auto-redeem on mount, then redirect to /chat (or
 *                          ?next= if specified)
 *   - (no token)       -> show a small form for the user to request a link
 *
 * On a successful redeem the access token goes into memory and the
 * backend sets the httpOnly refresh cookie - same shape as the normal
 * login flow.
 */

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAccessToken } from "../../api/auth";

const BASE_URL = (
  process.env.NEXT_PUBLIC_BACKEND_API_PORT || "http://localhost:8000"
).replace(/\/+$/, "") + "/";

function MagicLinkInner() {
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get("token");
  const nextPath = search.get("next") || "/chat";
  const consumedRef = useRef(false);

  const [status, setStatus] = useState(token ? "consuming" : "idle");
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  // Auto-redeem when we arrive with a token. Guard against React 18 strict-mode
  // double-invoke since the token is single-use on the backend.
  useEffect(() => {
    if (!token || consumedRef.current) return;
    consumedRef.current = true;

    (async () => {
      try {
        const res = await fetch(`${BASE_URL}api/auth/magic/consume/`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.access) {
          setStatus("failed");
          setError(data.detail || "This link is no longer valid.");
          return;
        }
        setAccessToken(data.access);
        setStatus("ok");
        // Tiny delay so the success state is visible.
        setTimeout(() => router.replace(nextPath), 600);
      } catch {
        setStatus("failed");
        setError("Couldn't reach the server. Try again in a moment.");
      }
    })();
  }, [token, nextPath, router]);

  const requestLink = async (e) => {
    e?.preventDefault();
    if (submitting) return;
    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}api/auth/magic/request/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to send the link.");
      }
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ---- render ----

  if (token) {
    return (
      <Card>
        {status === "consuming" && (
          <Centered>
            <p className="text-[var(--textColor)]">Signing you in...</p>
          </Centered>
        )}
        {status === "ok" && (
          <Centered>
            <p className="text-[var(--textColor)] mb-2">You're in!</p>
            <p className="text-[var(--textColor2)] text-sm">Redirecting...</p>
          </Centered>
        )}
        {status === "failed" && (
          <Centered>
            <p className="text-red-500 mb-3">{error}</p>
            <button
              onClick={() => router.push("/auth/magic")}
              className="px-4 py-2 rounded-lg bg-[var(--primaryColor)] text-white"
            >
              Request a new link
            </button>
          </Centered>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="text-2xl font-semibold text-center mb-2 text-[var(--textColor)]">
        Sign in with a magic link
      </h1>
      <p className="text-sm text-center text-[var(--textColor2)] mb-6">
        We'll email you a one-time link. No password needed.
      </p>

      {sent ? (
        <div className="text-center text-[var(--textColor)]">
          <p>Check your inbox.</p>
          <p className="text-sm text-[var(--textColor2)] mt-2">
            If we have an account for that address, the link is on its way.
          </p>
        </div>
      ) : (
        <form onSubmit={requestLink} className="space-y-3">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full min-h-[44px] px-4 py-3 rounded-lg bg-[var(--backgroundColor)] text-[var(--textColor)] outline-none focus:ring-2 focus:ring-[var(--primaryColor)]"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[44px] px-4 py-3 rounded-lg bg-[var(--primaryColor)] text-white font-semibold disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Email me a link"}
          </button>
        </form>
      )}
    </Card>
  );
}

function Card({ children }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md bg-[var(--background2)] rounded-2xl p-8 shadow-lg">
        {children}
      </div>
    </main>
  );
}

function Centered({ children }) {
  return <div className="text-center py-6">{children}</div>;
}

export default function MagicLinkPage() {
  // useSearchParams requires a Suspense boundary in App Router.
  return (
    <Suspense fallback={null}>
      <MagicLinkInner />
    </Suspense>
  );
}
