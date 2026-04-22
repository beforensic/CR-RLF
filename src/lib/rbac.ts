import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Role, User } from "@prisma/client";
import { db } from "@/lib/db";

export type AuthedUser = User;

// Fetch or lazily create the DB mirror of a Clerk user.
// The webhook is the primary sync path; this is the fallback
// for the race between first sign-in and webhook delivery.
export async function getCurrentUser(): Promise<AuthedUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (existing) return existing;

  const client = await clerkClient();
  const clerk = await client.users.getUser(userId);
  const primaryEmail =
    clerk.emailAddresses.find((e) => e.id === clerk.primaryEmailAddressId)
      ?.emailAddress ?? clerk.emailAddresses[0]?.emailAddress;

  if (!primaryEmail) return null;

  const metaRole = (clerk.publicMetadata?.role as Role | undefined) ?? "LEARNER";

  return db.user.upsert({
    where: { clerkUserId: userId },
    create: {
      clerkUserId: userId,
      email: primaryEmail.toLowerCase(),
      name:
        [clerk.firstName, clerk.lastName].filter(Boolean).join(" ").trim() ||
        primaryEmail,
      role: metaRole,
    },
    update: {},
  });
}

export async function requireUser(): Promise<AuthedUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (!user.isActive) redirect("/unauthorized?reason=inactive");
  return user;
}

export async function requireRole(roles: Role[]): Promise<AuthedUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/unauthorized");
  return user;
}

export function hasRole(user: AuthedUser | null, roles: Role[]) {
  return !!user && roles.includes(user.role);
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  LEARNER: "Apprenant",
};
