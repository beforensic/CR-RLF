import { SignIn } from "@clerk/nextjs";

export const metadata = {
  title: "Connexion — CR-RLF OSINT",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <section className="hidden lg:flex flex-col justify-between p-12 bg-foreground text-background">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-accent" aria-hidden />
          <span className="font-semibold tracking-tight">Croix-Rouge · RLF</span>
        </div>
        <div className="space-y-4 max-w-md">
          <h1 className="text-3xl font-semibold leading-tight">
            Formation OSINT
          </h1>
          <p className="text-background/70">
            Plateforme privée du Service Rassemblement des liens familiaux.
            Accès sur invitation uniquement.
          </p>
        </div>
        <p className="text-xs text-background/50">
          © Croix-Rouge de Belgique
        </p>
      </section>
      <section className="flex items-center justify-center p-6">
        <SignIn
          appearance={{ elements: { card: "shadow-none border" } }}
          signUpUrl={undefined}
        />
      </section>
    </main>
  );
}
