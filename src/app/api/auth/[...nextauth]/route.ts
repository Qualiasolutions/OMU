import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Properly setup NextAuth handler for App Router
const handler = NextAuth(authOptions);

// Export GET and POST handlers
export { handler as GET, handler as POST }; 