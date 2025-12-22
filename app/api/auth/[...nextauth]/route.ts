/**
 * NextAuth v5 API Route Handler
 *
 * Handles all NextAuth authentication endpoints:
 * - POST /api/auth/signin - Login
 * - POST /api/auth/signout - Logout
 * - GET /api/auth/session - Get current session
 * - GET /api/auth/csrf - Get CSRF token
 * - etc.
 *
 * Configuration is in lib/auth.ts
 */

import { handlers } from '@/lib/auth';

// Export NextAuth handlers for GET and POST requests
export const { GET, POST } = handlers;
