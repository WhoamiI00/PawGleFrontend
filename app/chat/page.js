"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/navbar";
import api from "../api/api";
import { bootstrapAccessToken, isAuthenticated } from "../api/auth";
import { useRouter } from "next/navigation";

function timeAgo(iso) {
  if (!iso) return "";
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ConversationsList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await bootstrapAccessToken();
      if (!isAuthenticated()) {
        router.push("/login");
        return;
      }
      try {
        const res = await api.get("api/auth/chat/conversations/");
        if (!cancelled) setConversations(res.data || []);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.detail || "Failed to load conversations");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-[var(--backgroundColor)] text-[var(--textColor)]">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-6">Messages</h1>

          {loading && (
            <p className="text-[var(--textColor2)]">Loading conversations...</p>
          )}
          {error && (
            <p className="text-red-500">{error}</p>
          )}

          {!loading && !error && conversations.length === 0 && (
            <div className="bg-[var(--background2)] rounded-lg p-8 text-center">
              <p className="text-[var(--textColor2)]">
                No conversations yet. When someone reports finding a pet that
                matches one of yours, a chat will start here automatically.
              </p>
            </div>
          )}

          <ul className="space-y-2">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/chat/${c.id}`}
                  className="flex items-center gap-3 p-3 bg-[var(--background2)] hover:bg-[var(--c3)] rounded-lg transition"
                >
                  <div className="w-12 h-12 rounded-full bg-[var(--c2)] overflow-hidden flex-shrink-0">
                    {c.pet_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.pet_image_url}
                        alt={c.pet_name}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="font-semibold truncate">{c.pet_name}</span>
                      <span className="text-xs text-[var(--textColor2)] flex-shrink-0">
                        {timeAgo(c.last_message_at || c.created_at)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline gap-2">
                      <p className="text-sm text-[var(--textColor2)] truncate">
                        {c.last_message_preview || "No messages yet"}
                      </p>
                      {c.unread_count > 0 && (
                        <span className="text-xs bg-[var(--primaryColor)] text-white font-bold rounded-full px-2 py-0.5 flex-shrink-0">
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
