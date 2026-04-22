import { z } from "zod";

export const inviteUserSchema = z.object({
  email: z.string().email().max(200),
  name: z.string().min(1).max(120),
  role: z.enum(["ADMIN", "MANAGER", "LEARNER"]),
  managedById: z.string().cuid().optional().nullable(),
});
export type InviteUserInput = z.infer<typeof inviteUserSchema>;

export const updateUserSchema = z.object({
  userId: z.string().cuid(),
  name: z.string().min(1).max(120).optional(),
  role: z.enum(["ADMIN", "MANAGER", "LEARNER"]).optional(),
  managedById: z.string().cuid().nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
