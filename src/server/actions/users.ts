"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  inviteUserSchema,
  updateUserSchema,
  type InviteUserInput,
  type UpdateUserInput,
} from "@/lib/validations/user";

// Invite a user: creates Clerk invitation (sends email with sign-up link)
// and primes the DB row with the desired role / manager.
export async function inviteUser(input: InviteUserInput) {
  const actor = await requireRole(["ADMIN"]);
  const data = inviteUserSchema.parse(input);

  if (data.managedById) {
    const m = await db.user.findUnique({ where: { id: data.managedById } });
    if (!m || !["ADMIN", "MANAGER"].includes(m.role)) {
      throw new Error("Manager invalide");
    }
  }

  const client = await clerkClient();
  const appUrl =
    process.env.APP_URL ?? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`;

  const invite = await client.invitations.createInvitation({
    emailAddress: data.email.toLowerCase(),
    redirectUrl: `${appUrl}/sign-in`,
    publicMetadata: { role: data.role },
  });

  await logAudit({
    actorId: actor.id,
    action: "user.invite",
    target: data.email.toLowerCase(),
    metadata: {
      role: data.role,
      managedById: data.managedById,
      invitationId: invite.id,
    },
  });

  // Pre-create a pending DB row so managed relationship can be set before
  // the webhook fires. We key by email; the webhook will fill clerkUserId.
  await db.user.upsert({
    where: { email: data.email.toLowerCase() },
    create: {
      clerkUserId: `pending_${invite.id}`,
      email: data.email.toLowerCase(),
      name: data.name,
      role: data.role,
      managedById: data.managedById ?? null,
      isActive: true,
    },
    update: {
      name: data.name,
      role: data.role,
      managedById: data.managedById ?? null,
    },
  });

  revalidatePath("/admin/users");
}

export async function updateUser(input: UpdateUserInput) {
  const actor = await requireRole(["ADMIN"]);
  const data = updateUserSchema.parse(input);

  const target = await db.user.findUnique({ where: { id: data.userId } });
  if (!target) throw new Error("Utilisateur introuvable");

  if (data.managedById) {
    const m = await db.user.findUnique({ where: { id: data.managedById } });
    if (!m || !["ADMIN", "MANAGER"].includes(m.role)) {
      throw new Error("Manager invalide");
    }
  }

  const updated = await db.user.update({
    where: { id: data.userId },
    data: {
      name: data.name,
      role: data.role,
      managedById:
        data.managedById === undefined ? undefined : data.managedById,
      isActive: data.isActive,
    },
  });

  // Mirror role to Clerk publicMetadata so middleware / future clients can read it.
  if (!updated.clerkUserId.startsWith("pending_")) {
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(updated.clerkUserId, {
        publicMetadata: { role: updated.role },
      });
      if (data.isActive === false) {
        await client.users.banUser(updated.clerkUserId);
      } else if (data.isActive === true) {
        await client.users.unbanUser(updated.clerkUserId);
      }
    } catch (err) {
      console.error("[users] clerk sync failed", err);
    }
  }

  await logAudit({
    actorId: actor.id,
    action: "user.update",
    target: updated.id,
    metadata: {
      role: data.role,
      managedById: data.managedById,
      isActive: data.isActive,
    },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/roles");
}
