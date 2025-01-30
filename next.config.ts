// /** @type {import('next').NextConfig} */
// const nextConfig = {};

// export default nextConfig;


/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    output: 'standalone',
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
