"use client";

/**
 * Public landing page for QR-tag scans.
 *
 * No auth required - this is what a stranger sees after scanning the
 * collar tag. Shows minimal pet info and steers them into either filing
 * a found report (which kicks off the auto-match + chat flow) or
 * signing in if they already have an account.
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function FoundPetLanding() {
  const { animalId } = useParams();
  const router = useRouter();
  const [pet, setPet] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const BACKEND = (
    process.env.NEXT_PUBLIC_BACKEND_API_PORT || "http://localhost:8000"
  ).replace(/\/+$/, "");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BACKEND}/api/auth/found/${animalId}/`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("not_found");
        const data = await res.json();
        if (!cancelled) setPet(data);
      } catch {
        if (!cancelled) setError("This tag isn't recognised. Double-check the code and try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [animalId, BACKEND]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--backgroundColor)] text-[var(--textColor)]">
        <p>Loading pet info...</p>
      </main>
    );
  }

  if (error || !pet) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--backgroundColor)] text-[var(--textColor)] px-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold mb-2">Tag not found</h1>
          <p className="text-[var(--textColor2)]">{error}</p>
          <Link
            href="/"
            className="inline-block mt-6 px-5 py-2 rounded-lg bg-[var(--primaryColor)] text-white"
          >
            Go to PawGle home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--backgroundColor)] text-[var(--textColor)] px-4 py-8">
      <div className="max-w-md mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold">
            Paw<span className="text-[var(--primaryColor)]">Gle</span>
          </h1>
          <p className="text-[var(--textColor2)] mt-1">You found a pet!</p>
        </header>

        <div className="bg-[var(--background2)] rounded-2xl p-6 shadow-lg">
          {pet.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pet.images[0]}
              alt={pet.name}
              className="w-full h-64 object-cover rounded-xl mb-4"
            />
          )}
          <h2 className="text-2xl font-semibold">{pet.name}</h2>
          <p className="text-[var(--textColor2)]">
            {pet.breed} · {pet.type}
          </p>
          <p className="text-xs text-[var(--textColor2)] mt-1">Tag ID: {pet.animal_id}</p>

          <div className="mt-6 space-y-3">
            <button
              onClick={() =>
                router.push(
                  `/pet/report?animal_id=${encodeURIComponent(pet.animal_id)}&prefill_name=${encodeURIComponent(pet.name)}`
                )
              }
              className="w-full py-3 rounded-lg bg-[var(--primaryColor)] text-white font-semibold"
            >
              I found this pet — alert the owner
            </button>
            <p className="text-xs text-center text-[var(--textColor2)]">
              You'll be asked for your location and (optionally) a photo.
              We'll let {pet.name}'s owner know right away.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--textColor2)] mt-6">
          Already have a PawGle account?{" "}
          <Link href="/login" className="text-[var(--primaryColor)] hover:underline">
            Sign in
          </Link>{" "}
          to chat with the owner directly.
        </p>
      </div>
    </main>
  );
}
