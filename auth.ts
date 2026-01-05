/**
 * Auth module - NextAuth v5 configuration
 *
 * TEMPORARY: Basic auth stub for deployment
 * TODO: Implement full NextAuth configuration
 */

import NextAuth from "next-auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [],
  pages: {
    signIn: '/login',
  },
});
