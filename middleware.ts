/**
 * Next.js Middleware - Subdomain Routing & Route Protection
 *
 * Handles:
 * 1. Alias redirect: its.thebackstage.app → in.thebackstage.app
 * 2. Marketing domain (thebackstage.app) root auto-redirect
 * 3. Product domain (in.thebackstage.app) root auto-redirect
 * 4. Escape hatch with ?public=true query parameter
 * 5. Protected route authentication
 *
 * Routing Logic:
 * - thebackstage.app/ (marketing)
 *   - Unauthenticated: Show landing page
 *   - Authenticated: Redirect to in.thebackstage.app/dashboard
 *   - Authenticated + ?public=true: Show landing page (escape hatch)
 *
 * - in.thebackstage.app/ (product)
 *   - Unauthenticated: Redirect to thebackstage.app/login
 *   - Authenticated: Redirect to /dashboard
 *
 * Protected routes (in.thebackstage.app):
 * - /dashboard/*
 * - /settings/*
 *
 * IMPORTANT: This middleware runs in Edge Runtime (not Node.js).
 * We import from auth.config.ts which is Edge-compatible (no DB, no crypto).
 * The full auth logic (with database) is in auth.ts for API routes.
 */

import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

const { auth } = NextAuth(authConfig);

export default auth(async function middleware(req) {
  const { pathname, searchParams, hostname } = req.nextUrl;
  const session = req.auth;

  // ========================================
  // 1. ALIAS REDIRECT: its.* → in.*
  // ========================================
  if (hostname === 'its.thebackstage.app') {
    const url = req.nextUrl.clone();
    url.hostname = 'in.thebackstage.app';
    return NextResponse.redirect(url);
  }

  // ========================================
  // 2. ROOT LANDING PAGE AUTO-REDIRECT
  // ========================================
  if (hostname === 'thebackstage.app' && pathname === '/') {
    const viewAsPublic = searchParams.get('public') === 'true';

    if (session && !viewAsPublic) {
      // Authenticated user WITHOUT escape hatch → redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', 'https://in.thebackstage.app'));
    }

    // Unauthenticated user OR with ?public=true → show landing page
    return NextResponse.next();
  }

  // ========================================
  // 3. SUBDOMAIN ROUTING: in.*
  // ========================================
  if (hostname === 'in.thebackstage.app') {
    // Handle root path of product subdomain
    if (pathname === '/') {
      if (session) {
        // Authenticated user → redirect to dashboard
        return NextResponse.redirect(new URL('/dashboard', req.url));
      } else {
        // Unauthenticated user → redirect to login on main domain
        return NextResponse.redirect(new URL('/login', 'https://thebackstage.app'));
      }
    }

    // Dashboard/Settings already protected by NextAuth middleware (see config.matcher below)
    // Only allow authenticated access
    return NextResponse.next();
  }

  // ========================================
  // 4. PROTECTED ROUTES (NextAuth default)
  // ========================================
  // NextAuth automatically redirects to /login if no session
  // for routes in config.matcher
  return NextResponse.next();
});

/**
 * Matcher Configuration
 *
 * Run middleware on:
 * - Root path (for auto-redirect logic)
 * - Protected dashboard and settings routes
 */
export const config = {
  matcher: [
    '/', // Intercept root for auto-redirect
    '/dashboard/:path*', // Protect dashboard
    '/settings/:path*', // Protect settings
  ],
};
