import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export async function logAudit(params: {
  actorId?: string | null;
  action: string;
  target?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  try {
    await db.auditLog.create({
      data: {
        actorId: params.actorId ?? null,
        action: params.action,
        target: params.target ?? null,
        metadata: params.metadata ?? undefined,
      },
    });
  } catch (err) {
    console.error("[audit] failed to record", params.action, err);
  }
}
