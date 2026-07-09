/** @type {import('next').NextConfig} */
const lanHost = process.env.LAN_DEV_HOST ?? '192.168.1.12';

const nextConfig = {
  reactStrictMode: true,
  // Celular na mesma Wi‑Fi: libera HMR/WebSocket do next dev (evita ws://IP:3000/_next/webpack-hmr failed)
  allowedDevOrigins: [
    lanHost,
    `http://${lanHost}:3000`,
    '192.168.1.5',
    'http://192.168.1.5:3000',
    'localhost',
    '127.0.0.1'
  ],
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
        source: '/app/manifest/:psfId',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Content-Type', value: 'application/manifest+json; charset=utf-8' }
        ]
      }
    ];
  }
};
export default nextConfig;
