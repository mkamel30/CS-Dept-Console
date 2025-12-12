
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https'
      ,
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  watchOptions: {
    poll: 1000,
    aggregateTimeout: 300,
  },
  allowedDevOrigins: [
      'https://6000-firebase-studio-1765460332705.cluster-fbfjltn375c6wqxlhoehbz44sk.cloudworkstations.dev',
  ],
};

export default nextConfig;
