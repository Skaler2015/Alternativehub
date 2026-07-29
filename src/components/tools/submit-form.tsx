"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/misc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SubmitForm({ categories }: { categories: { slug: string; name: string }[] }) {
  const { status } = useSession();
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    websiteUrl: "",
    tagline: "",
    description: "",
    categorySlug: "",
    pricingModel: "FREEMIUM",
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== "authenticated") {
      toast.info("Log in to submit a tool");
      router.push("/login");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tagline: form.tagline || undefined }),
    });
    setSubmitting(false);
    const data = await res.json().catch(() => null);
    if (res.ok) {
      toast.success("Submitted! Your tool is pending review.");
      router.push("/dashboard");
    } else {
      toast.error(data?.error ?? "Submission failed");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border bg-card p-6 soft-shadow">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Tool name *</Label>
          <Input
            id="name"
            required
            minLength={2}
            maxLength={80}
            placeholder="e.g. Obsidian"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="websiteUrl">Website URL *</Label>
          <Input
            id="websiteUrl"
            required
            type="url"
            placeholder="https://example.com"
            value={form.websiteUrl}
            onChange={(e) => set("websiteUrl", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tagline">Tagline</Label>
        <Input
          id="tagline"
          maxLength={120}
          placeholder="One sentence that captures what it does"
          value={form.tagline}
          onChange={(e) => set("tagline", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          required
          minLength={40}
          rows={5}
          placeholder="What does this tool do? Who is it for? What makes it a great alternative? (min. 40 characters)"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Category *</Label>
          <Select value={form.categorySlug} onValueChange={(v) => set("categorySlug", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Pick a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.slug} value={cat.slug}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Pricing model *</Label>
          <Select value={form.pricingModel} onValueChange={(v) => set("pricingModel", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FREE">Free</SelectItem>
              <SelectItem value="FREEMIUM">Freemium</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
              <SelectItem value="ONE_TIME">One-time purchase</SelectItem>
              <SelectItem value="OPEN_SOURCE">Open Source</SelectItem>
              <SelectItem value="CONTACT">Contact for pricing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        type="submit"
        variant="gradient"
        size="lg"
        disabled={submitting || !form.categorySlug}
        className="w-full"
      >
        <Rocket className="size-4" />
        {submitting ? "Submitting..." : "Submit for review"}
      </Button>
    </form>
  );
}
