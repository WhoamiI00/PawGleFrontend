"use client";

// Cloudflare Pages requires dynamic Next.js routes to opt into the edge runtime.
export const runtime = "edge";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navbar";
import api from "../../api/api";
import { bootstrapAccessToken, isAuthenticated, getCurrentUserId } from "../../api/auth";

const POLL_MS = 5000;

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

export default function ChatThread() {
  const { id } = useParams();
  const router = useRouter();

  const [meta, setMeta] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);

  // Pagination cursor: server timestamps after which we want NEW messages only.
  const lastFetchedAt = useRef(null);
  const scrollRef = useRef(null);
  const pollHandle = useRef(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const fetchMessages = useCallback(async () => {
    try {
      const params = lastFetchedAt.current ? { after: lastFetchedAt.current } : {};
      const res = await api.get(`api/auth/chat/conversations/${id}/messages/`, { params });
      const newMessages = res.data?.messages || [];
      if (newMessages.length) {
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const merged = [...prev, ...newMessages.filter((m) => !seen.has(m.id))];
          return merged;
        });
        // Cursor advances to the latest message we've seen.
        lastFetchedAt.current = newMessages[newMessages.length - 1].created_at;
        // Defer scroll until DOM has the new rows.
        setTimeout(scrollToBottom, 30);
      }
    } catch (err) {
      if (err?.response?.status === 403 || err?.response?.status === 404) {
        router.push("/chat");
      }
    }
  }, [id, router]);

  // Initial load: metadata + first batch of messages.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await bootstrapAccessToken();
      if (!isAuthenticated()) {
        router.push("/login");
        return;
      }
      try {
        const metaRes = await api.get(`api/auth/chat/conversations/${id}/`);
        if (!cancelled) setMeta(metaRes.data);

        const msgRes = await api.get(`api/auth/chat/conversations/${id}/messages/`);
        const list = msgRes.data?.messages || [];
        if (!cancelled) {
          setMessages(list);
          if (list.length) {
            lastFetchedAt.current = list[list.length - 1].created_at;
          }
          setTimeout(scrollToBottom, 30);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.detail || "Failed to load conversation");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  // Polling loop.
  useEffect(() => {
    if (loading || error) return undefined;
    pollHandle.current = setInterval(fetchMessages, POLL_MS);
    return () => clearInterval(pollHandle.current);
  }, [loading, error, fetchMessages]);

  const send = async (e) => {
    e?.preventDefault();
    if (sending) return;
    if (!draft.trim() && files.length === 0) return;

    setSending(true);
    try {
      const fd = new FormData();
      fd.append("body", draft);
      files.forEach((f) => fd.append("attachments", f));

      const res = await api.post(`api/auth/chat/conversations/${id}/messages/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Optimistically append; the next poll will reconcile.
      setMessages((prev) => [...prev, res.data]);
      lastFetchedAt.current = res.data.created_at;
      setDraft("");
      setFiles([]);
      setTimeout(scrollToBottom, 30);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const onPickFiles = (e) => {
    const picked = Array.from(e.target.files || []).slice(0, 6);
    setFiles(picked);
  };

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-[var(--backgroundColor)] text-[var(--textColor)]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col" style={{ height: "calc(100vh - 7rem)" }}>
          <div className="flex items-center gap-3 pb-3 border-b border-[var(--c3)]">
            <Link href="/chat" className="text-[var(--primaryColor)] hover:underline">
              ← Back
            </Link>
            {meta && (
              <div className="flex items-center gap-2 min-w-0">
                {meta.pet_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={meta.pet_image_url}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <h1 className="text-lg font-semibold truncate">{meta.pet_name}</h1>
              </div>
            )}
          </div>

          {error && <p className="text-red-500 mt-3">{error}</p>}

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto py-4 space-y-3"
          >
            {loading && (
              <div className="space-y-3" aria-busy="true" aria-label="Loading messages">
                {[
                  { mine: false, w: "60%" },
                  { mine: true, w: "45%" },
                  { mine: false, w: "70%" },
                  { mine: true, w: "30%" },
                ].map((row, i) => (
                  <div
                    key={i}
                    className={`flex ${row.mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className="skeleton h-12 rounded-2xl"
                      style={{ width: row.w }}
                    />
                  </div>
                ))}
              </div>
            )}
            {!loading && messages.length === 0 && (
              <p className="text-[var(--textColor2)] text-center">
                No messages yet. Say hi.
              </p>
            )}
            {messages.map((m) => {
              const myId = getCurrentUserId();
              const mine = m.sender_id && myId != null && Number(m.sender_id) === myId;
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      mine
                        ? "bg-[var(--primaryColor)] text-white"
                        : "bg-[var(--background2)] text-[var(--textColor)]"
                    }`}
                  >
                    {!mine && (
                      <p className="text-xs font-semibold mb-0.5 opacity-80">
                        {m.sender_name || "Unknown"}
                      </p>
                    )}
                    {m.body && (
                      <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>
                    )}
                    {m.attachments?.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-1">
                        {m.attachments.map((a) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <a
                            key={a.id}
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={a.url}
                              alt="attachment"
                              className="rounded-md w-full h-32 object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] opacity-60 mt-1 text-right">
                      {formatTime(m.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={send} className="border-t border-[var(--c3)] pt-3">
            {files.length > 0 && (
              <p className="text-xs text-[var(--textColor2)] mb-2">
                {files.length} attachment{files.length === 1 ? "" : "s"} ready
              </p>
            )}
            <div className="flex gap-2 items-end">
              <label className="cursor-pointer px-3 py-2 rounded-lg bg-[var(--background2)] hover:bg-[var(--c3)] text-[var(--textColor)]">
                📎
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={onPickFiles}
                  className="hidden"
                />
              </label>
              <textarea
                rows={1}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Write a message..."
                className="flex-1 resize-none bg-[var(--background2)] rounded-lg px-3 py-2 text-[var(--textColor)] outline-none focus:ring-2 focus:ring-[var(--primaryColor)]"
              />
              <button
                type="submit"
                disabled={sending || (!draft.trim() && files.length === 0)}
                className="px-4 py-2 rounded-lg bg-[var(--primaryColor)] text-white font-semibold disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

