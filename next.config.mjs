/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['imagedelivery.net'],
    formats: ['image/webp', 'image/avif'],
  },
}

export default nextConfig
