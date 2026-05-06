/**
 * NextAuth.js API route handler
 * Requirements: 5.1, 5.2, 5.3, 5.5, 5.6
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
