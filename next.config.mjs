/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @react-pdf/renderer needs to run in the Node.js runtime (not Edge) and
  // should not be bundled aggressively by the server build.
  serverExternalPackages: ["@react-pdf/renderer"],
  // Pin the workspace root to this project so Next doesn't pick up an unrelated
  // lockfile elsewhere on the machine when inferring the root.
  outputFileTracingRoot: import.meta.dirname,
};

export default nextConfig;
