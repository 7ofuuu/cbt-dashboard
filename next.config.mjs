/** @type {import('next').NextConfig} */
const apiBaseUrl = process.env.NEXT_PUBLIC_HOST || 'http://localhost:3000/api';

const getApiOrigin = (url) => {
  try {
    return new URL(url).origin;
  } catch {
    return 'http://localhost:3000';
  }
};

const apiOrigin = getApiOrigin(apiBaseUrl);

// When the dashboard is served via ngrok, XHR goes to the ngrok backend.
// That origin must be allowed by CSP connect-src, otherwise the browser blocks it.
const ngrokApiOrigin = process.env.NEXT_PUBLIC_HOST_NGROK
  ? getApiOrigin(process.env.NEXT_PUBLIC_HOST_NGROK)
  : '';

const connectSrc = ["'self'", apiOrigin, ngrokApiOrigin].filter(Boolean).join(' ');

// User-uploaded images (logos, question attachments) are served by the API
// origin, so img-src must include the same hosts as connect-src.
const imgSrc = ["'self'", 'data:', 'blob:', apiOrigin, ngrokApiOrigin].filter(Boolean).join(' ');

const nextConfig = {
  // Let Next's dev server accept asset requests when reached via ngrok.
  allowedDevOrigins: ['*.ngrok-free.app', '*.ngrok.app'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src " + imgSrc,
              "connect-src " + connectSrc,
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
