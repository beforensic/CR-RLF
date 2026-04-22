import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";

export const metadata = { title: "Accès refusé — CR-RLF OSINT" };

export default async function Unauthorized({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const msg =
    reason === "inactive"
      ? "Votre compte a été désactivé. Contactez un administrateur."
      : "Vous n'avez pas les droits requis pour accéder à cette page.";
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border rounded-lg p-8 text-center space-y-4">
        <h1 className="text-2xl font-semibold">Accès refusé</h1>
        <p className="text-muted-foreground">{msg}</p>
        <div className="flex gap-3 justify-center pt-2">
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded border hover:bg-muted"
          >
            Tableau de bord
          </Link>
          <SignOutButton>
            <button className="px-4 py-2 rounded bg-foreground text-background hover:opacity-90">
              Se déconnecter
            </button>
          </SignOutButton>
        </div>
      </div>
    </main>
  );
}
