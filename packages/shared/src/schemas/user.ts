import { z } from "zod";

/**
 * ユーザーのロール定義
 */
export const userRoleSchema = z.enum(["admin", "user", "guest"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string().email(),
	role: userRoleSchema,
});

export type User = z.infer<typeof userSchema>;
