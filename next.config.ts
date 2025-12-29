import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Suppresses source map uploading logs during build
  silent: true,

  // Organization and project from Sentry
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token for uploading source maps
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Automatically annotate React components to show their full name in Sentry
  reactComponentAnnotation: {
    enabled: true,
  },

  // Disables automatic upload of source maps in development
  disableLogger: process.env.NODE_ENV !== 'production',

  // Hides Sentry-specific frames from stack traces
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Tunnel requests through a Next.js rewrite to circumvent ad-blockers
  tunnelRoute: '/monitoring',

  // Automatically inject Sentry config into the build
  autoInstrumentServerFunctions: true,
  autoInstrumentMiddleware: true,
};

// Export config with Sentry wrapper
export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
