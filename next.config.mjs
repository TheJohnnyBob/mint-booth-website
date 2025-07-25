/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export for Vercel - use dynamic features
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Vercel handles image optimization automatically
    domains: ['imagedelivery.net'], // Allow Cloudflare Images
    formats: ['image/webp', 'image/avif'],
  },
}

export default nextConfig
