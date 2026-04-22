import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Role, User } from "@prisma/client";
import { db } from "@/lib/db";

export type AuthedUser = User;

// Fetch or lazily create the DB mirror of a Clerk user.
// The webhook is the primary sync path; this is the fallback
// for the race between first sign-in and webhook delivery.
//
// Handles three cases:
//   (a) Row already synced by webhook or previous visit → return it.
//   (b) Pre-invited row exists keyed by email with `clerkUserId = "pending_…"`
//       → claim it by updating clerkUserId (preserves invited role / manager).
//   (c) Fresh sign-up with no prior row → create one.
// P2002 race (two concurrent RSC renders both inserting) resolves by refetch.
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

  const email = primaryEmail.toLowerCase();
  const name =
    [clerk.firstName, clerk.lastName].filter(Boolean).join(" ").trim() || email;
  const metaRole = (clerk.publicMetadata?.role as Role | undefined) ?? "LEARNER";

  // Case (b): claim a pending invite row by email.
  const pending = await db.user.findUnique({ where: { email } });
  if (pending && pending.clerkUserId.startsWith("pending_")) {
    return db.user.update({
      where: { id: pending.id },
      data: { clerkUserId: userId, name },
    });
  }

  // Case (c): fresh sign-up.
  try {
    return await db.user.create({
      data: { clerkUserId: userId, email, name, role: metaRole },
    });
  } catch (err) {
    // Concurrent render raced us to insert. Refetch and return whichever won.
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "P2002"
    ) {
      const again = await db.user.findUnique({
        where: { clerkUserId: userId },
      });
      if (again) return again;
    }
    throw err;
  }
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
