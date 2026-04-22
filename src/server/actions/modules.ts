"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  moduleInputSchema,
  lessonInputSchema,
  type ModuleInput,
  type LessonInput,
} from "@/lib/validations/module";

export async function createModule(input: ModuleInput) {
  const actor = await requireRole(["ADMIN"]);
  const data = moduleInputSchema.parse(input);
  const mod = await db.module.create({ data });
  await logAudit({
    actorId: actor.id,
    action: "module.create",
    target: mod.id,
    metadata: { slug: mod.slug, isPublished: mod.isPublished },
  });
  revalidatePath("/admin/modules");
  revalidatePath("/modules");
  return mod;
}

const updateModuleSchema = moduleInputSchema.partial().extend({
  id: z.string().cuid(),
});

export async function updateModule(input: z.infer<typeof updateModuleSchema>) {
  const actor = await requireRole(["ADMIN"]);
  const data = updateModuleSchema.parse(input);
  const { id, ...fields } = data;
  const mod = await db.module.update({ where: { id }, data: fields });
  await logAudit({
    actorId: actor.id,
    action: "module.update",
    target: id,
    metadata: fields,
  });
  revalidatePath("/admin/modules");
  revalidatePath("/modules");
  revalidatePath(`/modules/${mod.slug}`);
  return mod;
}

export async function deleteModule(id: string) {
  const actor = await requireRole(["ADMIN"]);
  z.string().cuid().parse(id);
  await db.module.delete({ where: { id } });
  await logAudit({
    actorId: actor.id,
    action: "module.delete",
    target: id,
  });
  revalidatePath("/admin/modules");
  revalidatePath("/modules");
}

export async function createLesson(input: LessonInput) {
  const actor = await requireRole(["ADMIN"]);
  const data = lessonInputSchema.parse(input);
  const lesson = await db.lesson.create({ data });
  await logAudit({
    actorId: actor.id,
    action: "lesson.create",
    target: lesson.id,
  });
  revalidatePath("/admin/modules");
  return lesson;
}
