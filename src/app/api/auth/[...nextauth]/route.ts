import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Set up NextAuth handler with proper error handling
export const GET = async (req: Request) => {
  try {
    return await NextAuth(authOptions)(req);
  } catch (error) {
    console.error("NextAuth GET error:", error);
    throw error;
  }
};

export const POST = async (req: Request) => {
  try {
    return await NextAuth(authOptions)(req);
  } catch (error) {
    console.error("NextAuth POST error:", error);
    throw error;
  }
}; 