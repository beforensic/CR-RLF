import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import type { Role } from "@prisma/client";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { ROLE_LABELS } from "@/lib/rbac";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER", "LEARNER"] },
  { href: "/modules", label: "Modules", icon: BookOpen, roles: ["ADMIN", "MANAGER", "LEARNER"] },
  { href: "/manager", label: "Espace manager", icon: UsersRound, roles: ["ADMIN", "MANAGER"] },
  { href: "/admin", label: "Administration", icon: ShieldCheck, roles: ["ADMIN"] },
];

export function AppShell({
  user,
  children,
}: {
  user: { name: string; email: string; role: Role };
  children: React.ReactNode;
}) {
  const visible = NAV.filter((item) => item.roles.includes(user.role));
  return (
    <div className="min-h-screen grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:flex flex-col border-r bg-card">
        <div className="h-16 flex items-center gap-3 px-6 border-b">
          <div className="h-6 w-6 rounded bg-accent" aria-hidden />
          <span className="font-semibold tracking-tight">CR-RLF OSINT</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {visible.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t text-xs text-muted-foreground">
          <div className="font-medium text-foreground">{user.name}</div>
          <div className="truncate">{user.email}</div>
          <div className="mt-1">{ROLE_LABELS[user.role]}</div>
        </div>
      </aside>
      <div className="flex flex-col">
        <header className="h-16 border-b bg-card flex items-center justify-between px-6">
          <div className="lg:hidden flex items-center gap-3">
            <div className="h-6 w-6 rounded bg-accent" aria-hidden />
            <span className="font-semibold">CR-RLF OSINT</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <UserButton />
          </div>
        </header>
        <main className="flex-1 p-6 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
