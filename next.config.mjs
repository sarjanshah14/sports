/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Never reuse a browser-cached copy of a data page when navigating: after an import or a
    // result, the next page must show it. (Next 14 keeps them ~30s by default.)
    staleTimes: { dynamic: 0, static: 180 },
    // Share cards read this font from disk at runtime; make sure it ships with the server code.
    outputFileTracingIncludes: { "/e/**": ["./src/app/fonts/BigShoulders-800.ttf"] },
  },
};

export default nextConfig;
