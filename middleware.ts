/**
 * Next.js Middleware - Route Protection
 *
 * Protects authenticated routes from unauthorized access.
 * Redirects unauthenticated users to /login.
 *
 * Protected routes:
 * - /dashboard/*
 * - /settings/*
 *
 * Public routes:
 * - / (home)
 * - /login
 * - /register
 * - /unsubscribe
 * - /api/* (API routes handle their own auth)
 *
 * IMPORTANT: This middleware runs in Edge Runtime (not Node.js).
 * We import from auth.config.ts which is Edge-compatible (no DB, no crypto).
 * The full auth logic (with database) is in auth.ts for API routes.
 */

import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

/**
 * Matcher Configuration
 *
 * Run middleware on protected routes only.
 */
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
  ],
};
