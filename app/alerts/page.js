"use client";

/**
 * Geographic radius alerts management.
 *
 * Lists the current user's saved alert areas and lets them add a new one
 * centered on their current GPS position (or coordinates they type in).
 * Notifications fire on the backend whenever a lost/found report lands
 * inside the radius.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import api from "../api/api";
import { bootstrapAccessToken, isAuthenticated } from "../api/auth";

export default function AlertsPage() {
  const router = useRouter();

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  // Form state
  const [label, setLabel] = useState("");
  const [radiusKm, setRadiusKm] = useState(5);
  const [statusFilter, setStatusFilter] = useState("");
  const [centerLat, setCenterLat] = useState("");
  const [centerLon, setCenterLon] = useState("");
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await bootstrapAccessToken();
      if (!isAuthenticated()) {
        router.push("/login");
        return;
      }
      try {
        const res = await api.get("api/auth/alerts/");
        if (!cancelled) setSubscriptions(res.data || []);
      } catch (err) {
        if (!cancelled) setError("Couldn't load alerts.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const fillCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Your browser doesn't support geolocation.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenterLat(pos.coords.latitude.toFixed(5));
        setCenterLon(pos.coords.longitude.toFixed(5));
        setLocating(false);
      },
      () => {
        setError("Couldn't read your location. Enter coordinates manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const createSub = async (e) => {
    e?.preventDefault();
    if (creating) return;
    const lat = parseFloat(centerLat);
    const lon = parseFloat(centerLon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      setError("Please choose a center location first.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await api.post("api/auth/alerts/", {
        label,
        center_lat: lat,
        center_lon: lon,
        radius_km: Number(radiusKm) || 5,
        status_filter: statusFilter,
      });
      setSubscriptions((prev) => [res.data, ...prev]);
      setLabel("");
      setRadiusKm(5);
      setStatusFilter("");
      setCenterLat("");
      setCenterLon("");
    } catch (err) {
      const detail = err?.response?.data;
      if (typeof detail === "string") setError(detail);
      else if (detail?.detail) setError(detail.detail);
      else setError("Couldn't save the alert.");
    } finally {
      setCreating(false);
    }
  };

  const deleteSub = async (id) => {
    try {
      await api.delete(`api/auth/alerts/${id}/`);
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError("Couldn't delete that alert.");
    }
  };

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-[var(--backgroundColor)] text-[var(--textColor)]">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
          <header>
            <h1 className="text-3xl font-bold">Nearby pet alerts</h1>
            <p className="text-[var(--textColor2)] mt-1">
              Get pinged whenever a lost or found pet is reported close to a
              place you care about.
            </p>
          </header>

          {error && (
            <p className="text-red-500 bg-red-500/10 rounded p-3 text-sm">
              {error}
            </p>
          )}

          <section className="bg-[var(--background2)] rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">Add an area</h2>
            <form onSubmit={createSub} className="space-y-3">
              <input
                type="text"
                placeholder='Label, e.g. "Home"'
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full min-h-[44px] px-4 py-2 rounded-lg bg-[var(--backgroundColor)] text-[var(--textColor)] outline-none focus:ring-2 focus:ring-[var(--primaryColor)]"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  value={centerLat}
                  onChange={(e) => setCenterLat(e.target.value)}
                  className="min-h-[44px] px-4 py-2 rounded-lg bg-[var(--backgroundColor)] text-[var(--textColor)] outline-none focus:ring-2 focus:ring-[var(--primaryColor)]"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  value={centerLon}
                  onChange={(e) => setCenterLon(e.target.value)}
                  className="min-h-[44px] px-4 py-2 rounded-lg bg-[var(--backgroundColor)] text-[var(--textColor)] outline-none focus:ring-2 focus:ring-[var(--primaryColor)]"
                />
              </div>
              <button
                type="button"
                onClick={fillCurrentLocation}
                disabled={locating}
                className="text-sm text-[var(--primaryColor)] hover:underline disabled:opacity-60"
              >
                {locating ? "Locating..." : "Use my current location"}
              </button>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm text-[var(--textColor2)] flex flex-col gap-1">
                  Radius (km)
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(e.target.value)}
                    className="min-h-[44px] px-4 py-2 rounded-lg bg-[var(--backgroundColor)] text-[var(--textColor)] outline-none focus:ring-2 focus:ring-[var(--primaryColor)]"
                  />
                </label>
                <label className="text-sm text-[var(--textColor2)] flex flex-col gap-1">
                  Notify about
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="min-h-[44px] px-4 py-2 rounded-lg bg-[var(--backgroundColor)] text-[var(--textColor)] outline-none focus:ring-2 focus:ring-[var(--primaryColor)]"
                  >
                    <option value="">Lost & found</option>
                    <option value="lost">Lost only</option>
                    <option value="found">Found only</option>
                  </select>
                </label>
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full min-h-[44px] py-3 rounded-lg bg-[var(--primaryColor)] text-white font-semibold disabled:opacity-60"
              >
                {creating ? "Saving..." : "Save alert"}
              </button>
            </form>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">Your alerts</h2>
            {loading ? (
              <ul className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <li key={i} className="skeleton h-16 rounded-lg" />
                ))}
              </ul>
            ) : subscriptions.length === 0 ? (
              <p className="text-[var(--textColor2)]">No alerts yet.</p>
            ) : (
              <ul className="space-y-2">
                {subscriptions.map((s) => (
                  <li
                    key={s.id}
                    className="flex justify-between items-center p-3 bg-[var(--background2)] rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {s.label || "Saved area"}
                      </p>
                      <p className="text-xs text-[var(--textColor2)]">
                        {s.radius_km.toFixed(0)} km around (
                        {Number(s.center_lat).toFixed(3)},{" "}
                        {Number(s.center_lon).toFixed(3)}){" "}
                        · {s.status_filter || "lost & found"}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteSub(s.id)}
                      className="text-red-500 hover:text-red-600 text-sm px-3 py-2"
                      aria-label="Delete alert"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
