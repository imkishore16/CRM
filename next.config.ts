import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
    async headers() {
        return [
            {
                source: "/api/:path*",
                headers: [
                    { key: "Access-Control-Allow-Credentials", value: "true" },
                    { key: "Access-Control-Allow-Origin", value: "*" },
                    { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
                    { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" }
                ]
            }
        ]
    },
    images: {
        remotePatterns: [
        {
        protocol: 'https',
        hostname: 'i.scdn.co',
        },
    ],  
        domains: ['images.unsplash.com','i.ytimg.com'],
    },
};

export default nextConfig;
