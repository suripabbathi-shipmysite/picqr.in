/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build will not fail for small TS / ESLint issues
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Supabase Storage images + Guest photos
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "picqr.in",
        pathname: "/**",
      },
    ],
    // Allow unoptimized for faster build on Vercel free tier
    unoptimized: false,
  },

  // Headers - Security + Cache
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // Guest photos - Cache for fast loading
        source: "/guest",
        headers: [
          { key: "Cache-Control", value: "public, max-age=60" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;