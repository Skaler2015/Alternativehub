"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/misc";

export function SettingsForm({
  initial,
  email,
}: {
  initial: { name: string; bio: string; website: string };
  email: string;
}) {
  const [form, setForm] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) toast.success("Profile updated");
    else toast.error("Could not save changes");
  };

  return (
    <form onSubmit={save} className="space-y-5 rounded-2xl border bg-card p-6">
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input value={email} disabled />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="name">Display name</Label>
        <Input
          id="name"
          value={form.name}
          maxLength={64}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          rows={3}
          maxLength={280}
          value={form.bio}
          onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          type="url"
          placeholder="https://"
          value={form.website}
          onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
        />
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
