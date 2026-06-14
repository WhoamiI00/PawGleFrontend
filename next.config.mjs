/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "localhost" },
      { hostname: "127.0.0.1" },
      { hostname: "animalbackend-10hd.onrender.com" },
      { hostname: "*.r2.cloudflarestorage.com" },
      { hostname: "pub-870342f2dffe4aeb864a2c49cee5d73b.r2.dev" },
    ],
  },
};

// Wrap with Sentry only when an auth token is present (build-time source-map
// upload). Locally and on platforms without it, fall through to the plain
// config so dev/build still work.
let exported = nextConfig;
if (process.env.SENTRY_AUTH_TOKEN) {
  // Dynamic require so we don't crash if @sentry/nextjs isn't installed yet.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { withSentryConfig } = await import("@sentry/nextjs");
  exported = withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    silent: !process.env.CI,
    widenClientFileUpload: true,
    disableLogger: true,
  });
}

export default exported;
