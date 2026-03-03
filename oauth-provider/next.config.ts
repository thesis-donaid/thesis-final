import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // reactCompiler: true,
  allowedDevOrigins: [
    "http://192.168.100.8:3000",
    "http://localhost:3000",
    "https://advocatory-mysticly-louis.ngrok-free.dev",
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      // Add other domains if needed (Facebook, GitHub, etc)./..
      {
        protocol: 'https',
        hostname: 'drive.google.com',
        pathname: '/**'
      }
    ],
    
  }
};

export default nextConfig;
