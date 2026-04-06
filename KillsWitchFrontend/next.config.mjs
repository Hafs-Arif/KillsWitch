/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['killswitch.us'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'killswitch.us',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'https://clever-snails-stand.loca.lt/:path*',
      },
    ];
  },
};

export default nextConfig;
