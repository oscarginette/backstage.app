/**
 * Auth module - NextAuth v5 configuration
 *
 * Full authentication configuration with database access.
 * Used by API routes (/api/auth/*) which run in Node.js runtime.
 *
 * For middleware (Edge Runtime), use auth.config.ts instead.
 */

import NextAuth from "next-auth";
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import type { UserRole } from '@/domain/types/user-roles';

// Ensure AUTH_SECRET is set (NextAuth v5 requirement)
if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
  throw new Error(
    'Missing AUTH_SECRET environment variable. ' +
    'Generate one with: openssl rand -base64 32'
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // IMPORTANT: This runs in API route context (Node.js runtime), NOT in Edge Runtime
        // We dynamically import the repository here to avoid Edge Runtime issues
        const { PostgresUserRepository } = await import('@/infrastructure/database/repositories/PostgresUserRepository');
        const userRepository = new PostgresUserRepository();

        try {
          // Validate credentials
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const email = credentials.email as string;
          const password = credentials.password as string;

          // Find user by email
          const user = await userRepository.findByEmail(email);
          if (!user) {
            return null; // User not found
          }

          // Check if user is active
          if (!user.active) {
            console.warn(`Login attempt for inactive user: ${email}`);
            return null; // Account deactivated
          }

          // Verify password
          const isValidPassword = await user.verifyPassword(password);
          if (!isValidPassword) {
            return null; // Invalid password
          }

          // Update last session timestamp
          try {
            await userRepository.updateLastSession(user.id);
          } catch (error) {
            console.error('Failed to update last session:', error);
            // Non-critical error, continue with login
          }

          // Return user data (NextAuth will create JWT)
          return {
            id: user.id.toString(),
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error('NextAuth authorize error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
      }

      // Session update (e.g., user changes profile)
      if (trigger === 'update') {
        // Fetch fresh user data from database
        const { PostgresUserRepository } = await import('@/infrastructure/database/repositories/PostgresUserRepository');
        const userRepository = new PostgresUserRepository();

        try {
          const userId = parseInt(token.id as string);
          const freshUser = await userRepository.findById(userId);
          if (freshUser) {
            token.email = freshUser.email;
            token.role = freshUser.role;
          }
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
});

/**
 * Type augmentation for NextAuth
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
    };
  }

  interface User {
    id: string;
    email: string;
    role: UserRole;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    email: string;
    role: UserRole;
  }
}
