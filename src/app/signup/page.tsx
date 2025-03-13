// This is a Server Component
import { Suspense } from "react";
import dynamic from "next/dynamic";

// Import the client component with dynamic import
const SignupForm = dynamic(() => import("./signup-form"), {
  ssr: false,
});

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
} 