// // /** @type {import('next').NextConfig} */
// // const nextConfig = {};

// // export default nextConfig;


// import type { NextConfig } from "next";

// const nextConfig = {
//     reactStrictMode: false,
//     output: 'standalone',
//     async headers() {
//       return [
//           {
//               // matching all API routes
//               source: "/api/:path*",
//               headers: [
//                   { key: "Access-Control-Allow-Credentials", value: "true" },
//                   { key: "Access-Control-Allow-Origin", value: "*" },
//                   { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
//                   { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" }
//               ]
//           }
//       ]
//   },
//     // images: {
//     //   remotePatterns: [
//     //     {
//     //       protocol: 'https',
//     //       hostname: 'i.scdn.co',
//     //     },
//     //   ],  
//     //     domains: ['images.unsplash.com','i.ytimg.com'],
//     //   },
// };

// export default nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
      if (isServer) {
        config.externals.push("onnxruntime-node");
      }
      return config;
    },
    experimental: {
      serverComponentsExternalPackages: ["pdf-parse"],
    },
  };
  
  module.exports = nextConfig;
  