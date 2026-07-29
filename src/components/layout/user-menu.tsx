"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Bookmark, LayoutDashboard, LogOut, Settings, Shield, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/misc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="size-8 animate-pulse rounded-full bg-muted" />;
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
          <Link href="/login">Log in</Link>
        </Button>
        <Button variant="gradient" size="sm" asChild>
          <Link href="/register">Sign up</Link>
        </Button>
      </div>
    );
  }

  const { user } = session;
  const isStaff = user.role === "ADMIN" || user.role === "MODERATOR";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
        <Avatar className="size-8 border">
          <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
          <AvatarFallback>{getInitials(user.name ?? user.email ?? "U")}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="truncate font-medium text-foreground">{user.name ?? "Account"}</div>
          <div className="truncate text-xs font-normal">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard"><LayoutDashboard /> Dashboard</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/bookmarks"><Bookmark /> Bookmarks</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/reviews"><Star /> My Reviews</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings"><Settings /> Settings</Link>
        </DropdownMenuItem>
        {isStaff && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin"><Shield /> Admin Panel</Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
