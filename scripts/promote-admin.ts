// Promote an existing user to ADMIN role.
// Usage: npx tsx scripts/promote-admin.ts user@example.com
//
// Requires DATABASE_URL and CLERK_SECRET_KEY in env. The user must already
// exist in Clerk (invited via admin UI or Clerk dashboard) and the webhook
// must have synced them into the DB.

import { PrismaClient } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";

async function main() {
  const email = process.argv[2]?.toLowerCase();
  if (!email) {
    console.error("Usage: tsx scripts/promote-admin.ts <email>");
    process.exit(1);
  }

  const db = new PrismaClient();

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User ${email} not found in DB. Invite them first.`);
    process.exit(1);
  }

  await db.user.update({
    where: { id: user.id },
    data: { role: "ADMIN" },
  });

  if (!user.clerkUserId.startsWith("pending_")) {
    const client = await clerkClient();
    await client.users.updateUserMetadata(user.clerkUserId, {
      publicMetadata: { role: "ADMIN" },
    });
  }

  console.log(`✅ ${email} is now ADMIN`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
