/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: deploy the `out/` folder to Vercel, Netlify or any static host.
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};
export default nextConfig;
