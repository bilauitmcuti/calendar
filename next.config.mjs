import path from 'path';
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';
import {
  NEXT_CONFIG_EXTRA_HEADER_ENTRIES,
  SECURITY_HEADER_ENTRIES,
} from './lib/security-headers.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      '@hugeicons/react',
      '@hugeicons/core-free-icons',
      '@base-ui/react',
    ],
  },
  env: {
    NEXT_PUBLIC_BUILD_ID: Date.now().toString(),
    // Inline at build from either name (Cloudflare build env may use TURNSTILE_SITE_KEY only).
    NEXT_PUBLIC_TURNSTILE_SITE_KEY:
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ||
      process.env.TURNSTILE_SITE_KEY?.trim() ||
      "",
  },
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/dev',
        destination: 'https://shahrulestar.com',
        permanent: true, // HTTP 308
      },
      {
        source: '/foundation',
        destination: '/',
        permanent: true, // HTTP 308
      },
      {
        source: '/pwa',
        destination: '/download',
        permanent: true, // HTTP 308
      },
      {
        source: '/sponsor',
        destination: 'https://shahrulestar.com/sponsor',
        permanent: true, // HTTP 308
      },
      {
        source: '/month',
        destination: '/calendar',
        permanent: true,
      },
      {
        source: '/month/:path*',
        destination: '/calendar/:path*',
        permanent: true,
      },
      {
        source: '/roadmap',
        destination:
          'https://bilauitmcuti.notion.site/3774a1187b9c8032ab31eb9a2fecf0ea?v=3774a1187b9c807793e9000c046a55e4',
        permanent: true, // HTTP 308
      },
    ]
  },
  async headers() {
    const securityHeaders = [
      ...NEXT_CONFIG_EXTRA_HEADER_ENTRIES,
      ...SECURITY_HEADER_ENTRIES,
    ].map(([key, value]) => ({ key, value }));
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

if (process.env.NODE_ENV === 'development' && process.env.SKIP_CLOUDFLARE_DEV !== '1') {
  try {
    await setupDevPlatform({
      configPath: path.resolve(process.cwd(), 'wrangler.jsonc'),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      [
        '⚠ Cloudflare dev platform unavailable — starting Next.js without Pages bindings.',
        `  Cause: ${message}`,
        '  Fix: ensure api.cloudflare.com is reachable, run `npx wrangler login`, then restart.',
        '  Offline UI only: set SKIP_CLOUDFLARE_DEV=1 before `pnpm dev`.',
      ].join('\n'),
    );
  }
}

export default nextConfig
