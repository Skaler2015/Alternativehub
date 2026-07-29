"use client";

import * as React from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

export function ContactForm() {
  const [form, setForm] = React.useState({ name: "", email: "", subject: "", message: "", website: "" });
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setSent(true);
      toast.success("Message sent — we'll get back to you soon!");
      setForm({ name: "", email: "", subject: "", message: "", website: "" });
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Could not send message");
    }
  };

  if (sent) {
    return (
      <div className="rounded-2xl border border-dashed bg-card p-8 text-center">
        <p className="text-lg font-semibold">Thanks for reaching out! 🎉</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your message is on its way. We&apos;ll reply to the email you provided.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => setSent(false)}>
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input placeholder="Your name" required value={form.name} onChange={set("name")} maxLength={80} />
        <Input type="email" placeholder="you@email.com" required value={form.email} onChange={set("email")} maxLength={160} />
      </div>
      <Input placeholder="Subject (optional)" value={form.subject} onChange={set("subject")} maxLength={120} />
      <Textarea
        placeholder="How can we help? (min. 10 characters)"
        required
        rows={5}
        value={form.message}
        onChange={set("message")}
        maxLength={4000}
      />
      {/* Honeypot — hidden from humans, catches bots */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={form.website}
        onChange={set("website")}
        className="hidden"
        aria-hidden
      />
      <Button type="submit" disabled={loading || form.message.length < 10} className="gap-1.5">
        <Send className="size-4" />
        {loading ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
