/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Lint e executado separadamente; nao bloqueia o build de producao.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
