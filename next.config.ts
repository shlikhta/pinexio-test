import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Bundle next-mdx-remote so its client runtime shares the app's React instance
  transpilePackages: ['next-mdx-remote'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
};

export default nextConfig;
