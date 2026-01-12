import { z } from "zod";
import { userSchema } from "../schemas/user";
import type { BodyEndpoint, GetEndpoint, NoBodyEndpoint } from "./types";

/**
 * GET /users/:id
 * 指定IDのユーザーを取得
 */
const getUserPathParamsSchema = z.object({
	id: z.string(),
});

export const getUserEndpoint: GetEndpoint<
	"/users/:id",
	typeof getUserPathParamsSchema,
	undefined,
	typeof userSchema
> = {
	method: "GET",
	path: "/users/:id",
	pathParams: getUserPathParamsSchema,
	query: undefined,
	request: undefined,
	response: userSchema,
} as const;

/**
 * GET /users
 * ユーザー一覧を取得（クエリパラメータでフィルタリング）
 */
const listUsersQuerySchema = z.object({
	page: z.coerce.number().int().positive().optional(),
	limit: z.coerce.number().int().positive().max(100).optional(),
	role: z.enum(["admin", "user", "guest"]).optional(),
});

const userListSchema = z.array(userSchema);

export const listUsersEndpoint: GetEndpoint<
	"/users",
	undefined,
	typeof listUsersQuerySchema,
	typeof userListSchema
> = {
	method: "GET",
	path: "/users",
	pathParams: undefined,
	query: listUsersQuerySchema,
	request: undefined,
	response: userListSchema,
} as const;

/**
 * POST /users
 * 新規ユーザーを作成
 */
const createUserRequestSchema = z.object({
	name: z.string().min(1),
	email: z.string().email(),
});

export const createUserEndpoint: BodyEndpoint<
	"POST",
	"/users",
	undefined,
	undefined,
	typeof createUserRequestSchema,
	typeof userSchema
> = {
	method: "POST",
	path: "/users",
	pathParams: undefined,
	query: undefined,
	request: createUserRequestSchema,
	response: userSchema,
} as const;

/**
 * DELETE /users/:id
 * 指定IDのユーザーを削除
 */
const deleteUserPathParamsSchema = z.object({
	id: z.string(),
});

const deleteUserResponseSchema = z.object({
	success: z.boolean(),
});

export const deleteUserEndpoint: NoBodyEndpoint<
	"DELETE",
	"/users/:id",
	typeof deleteUserPathParamsSchema,
	undefined,
	typeof deleteUserResponseSchema
> = {
	method: "DELETE",
	path: "/users/:id",
	pathParams: deleteUserPathParamsSchema,
	query: undefined,
	request: undefined,
	response: deleteUserResponseSchema,
} as const;
