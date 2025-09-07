/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "localhost" },
      { hostname: "127.0.0.1" },
      { hostname: "animalbackend-10hd.onrender.com" },
      { hostname: "sgvsgwmrgabhwfdxxbnf.supabase.co" }
    ],
  },
};
export default nextConfig;
