import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/dashboard/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { name: true, email: true, bio: true, website: true },
  });

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage your profile</p>
      <div className="mt-6">
        <SettingsForm
          initial={{
            name: user?.name ?? "",
            bio: user?.bio ?? "",
            website: user?.website ?? "",
          }}
          email={user?.email ?? ""}
        />
      </div>
    </div>
  );
}
