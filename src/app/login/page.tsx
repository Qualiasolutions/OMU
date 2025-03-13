// This is a Server Component
import { Suspense } from "react";
import dynamic from "next/dynamic";

// Import the client component with dynamic import
const LoginForm = dynamic(() => import("./login-form"), {
  ssr: false,
});

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
} 