// Sentry init for the Edge runtime (middleware on Edge, edge route handlers).
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT
      || process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT
      || "development",
    tracesSampleRate: Number(
      process.env.SENTRY_TRACES_SAMPLE_RATE
        || process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
        || 0.1
    ),
  });
}
