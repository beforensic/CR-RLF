import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Croix-Rouge RLF — Formation OSINT",
  description:
    "Plateforme de formation OSINT du Service Rassemblement des liens familiaux (Croix-Rouge de Belgique).",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider localization={frFR}>
      <html lang="fr" className="h-full antialiased">
        <body className="min-h-full bg-background text-foreground">
          {children}
          <Toaster richColors position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
