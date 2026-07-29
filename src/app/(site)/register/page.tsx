import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Sign up",
  description: "Create a free AlternativeHub account to bookmark tools, vote and write reviews.",
  path: "/register",
  noIndex: true,
});

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="aurora" aria-hidden />
      <AuthForm mode="register" />
    </div>
  );
}
