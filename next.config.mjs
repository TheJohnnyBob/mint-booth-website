/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true
  },
  // Optimize bundle size
  experimental: {
    optimizeCss: true,
  },
  // Reduce bundle size by excluding dev dependencies
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Reduce bundle size in production
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': require('path').resolve(__dirname),
      }
    }
    return config
  },
  // Exclude cache and other large files from static export
  distDir: '.next',
}

export default nextConfig
