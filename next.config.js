/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    swcPlugins: [],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'platform-lookaside.fbsbx.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'WUKSY',
    NEXT_PUBLIC_APP_DESCRIPTION: 'AI-Powered Personalized Wellness Platform',
  },
}

module.exports = nextConfig