import { hash } from "bcrypt";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Define validation schema for registration
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    console.log("Registration attempt for email:", body.email);
    
    // Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      console.error("Validation failed:", result.error.errors);
      return NextResponse.json(
        { message: "Validation failed", errors: result.error.errors },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        console.log("User already exists:", email);
        return NextResponse.json(
          { message: "User with this email already exists" },
          { status: 409 }
        );
      }
    } catch (dbError) {
      console.error("Database error checking existing user:", dbError);
      return NextResponse.json(
        { message: "Database error while checking user existence" },
        { status: 500 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    try {
      // Create new user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      console.log("User registered successfully:", email);

      return NextResponse.json(
        { message: "User registered successfully", user: userWithoutPassword },
        { status: 201 }
      );
    } catch (createError) {
      console.error("Error creating user:", createError);
      return NextResponse.json(
        { message: "Database error while creating user", error: createError instanceof Error ? createError.message : "Unknown error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { 
        message: "An error occurred during registration",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 