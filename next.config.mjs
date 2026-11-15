/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Share cards read this font from disk at runtime; make sure it ships with the server code.
    outputFileTracingIncludes: { "/e/**": ["./src/app/fonts/BigShoulders-800.ttf"] },
  },
};

export default nextConfig;
