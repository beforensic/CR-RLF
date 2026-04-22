import { headers } from "next/headers";
import { Webhook } from "svix";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

type ClerkEmail = { id: string; email_address: string };
type ClerkUserPayload = {
  id: string;
  email_addresses: ClerkEmail[];
  primary_email_address_id: string | null;
  first_name: string | null;
  last_name: string | null;
  public_metadata?: { role?: Role };
};

type ClerkEvent =
  | { type: "user.created" | "user.updated"; data: ClerkUserPayload }
  | { type: "user.deleted"; data: { id: string } };

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "missing_headers" }, { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(secret);
  let evt: ClerkEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkEvent;
  } catch {
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const u = evt.data;
    const primary =
      u.email_addresses.find((e) => e.id === u.primary_email_address_id) ??
      u.email_addresses[0];
    if (!primary) return NextResponse.json({ ok: true });

    const role: Role = u.public_metadata?.role ?? "LEARNER";
    const name =
      [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
      primary.email_address;

    await db.user.upsert({
      where: { clerkUserId: u.id },
      create: {
        clerkUserId: u.id,
        email: primary.email_address.toLowerCase(),
        name,
        role,
      },
      update: {
        email: primary.email_address.toLowerCase(),
        name,
      },
    });
  }

  if (evt.type === "user.deleted") {
    await db.user.updateMany({
      where: { clerkUserId: evt.data.id },
      data: { isActive: false },
    });
  }

  return NextResponse.json({ ok: true });
}
