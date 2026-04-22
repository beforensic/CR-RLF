import Link from "next/link";
import { requireRole } from "@/lib/rbac";

const TABS = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin/users", label: "Utilisateurs" },
  { href: "/admin/roles", label: "Rôles" },
  { href: "/admin/modules", label: "Modules" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(["ADMIN"]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Administration
        </h1>
        <p className="text-sm text-muted-foreground">
          Gestion des utilisateurs, rôles et contenus.
        </p>
      </div>
      <nav className="flex gap-1 border-b">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-foreground/30"
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <div>{children}</div>
    </div>
  );
}
