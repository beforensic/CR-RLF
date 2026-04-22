import { AppShell } from "@/components/nav/AppShell";
import { requireUser } from "@/lib/rbac";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <AppShell user={{ name: user.name, email: user.email, role: user.role }}>
      {children}
    </AppShell>
  );
}
