/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permite acessar o dev server pelo IP da rede local (celular na mesma Wi‑Fi)
  allowedDevOrigins: ['192.168.1.5'],
  async headers() {
    return [
      {
        source: '/app/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/app/' }
        ]
      },
      {
        source: '/app/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Content-Type', value: 'application/manifest+json; charset=utf-8' }
        ]
      }
    ];
  }
};
export default nextConfig;
