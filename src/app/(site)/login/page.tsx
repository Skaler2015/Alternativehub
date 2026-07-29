import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Log in",
  description: "Log in to AlternativeHub to bookmark tools, vote and write reviews.",
  path: "/login",
  noIndex: true,
});

export default function LoginPage() {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="aurora" aria-hidden />
      <AuthForm mode="login" />
    </div>
  );
}
