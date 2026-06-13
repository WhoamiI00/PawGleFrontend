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
export default nextConfig;
