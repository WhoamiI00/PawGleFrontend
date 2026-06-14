// Sentry init that runs in the browser. Opt-in via NEXT_PUBLIC_SENTRY_DSN -
// when unset, the SDK does nothing and the app behaves exactly as before.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "development",
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || 0.1),
    // Session replay is paid past a small free tier - off by default.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}
