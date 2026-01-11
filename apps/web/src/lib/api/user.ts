import {
	createUserEndpoint,
	deleteUserEndpoint,
	getUserEndpoint,
	listUsersEndpoint,
	type User,
} from "@sos26/shared";
import type { Result } from "../http/result";
import { callBodyApi, callGetApi, callNoBodyApi } from "./core";

/**
 * GET /users/:id
 * 指定IDのユーザーを取得
 *
 * UI側での使用例:
 * ```ts
 * const res = await getUser({ id: "123" });
 * if (!res.ok) {
 *   // エラーハンドリング
 *   console.error(res.error.kind);
 *   return;
 * }
 * // 成功時の処理
 * console.log(res.data.name);
 * ```
 */
export async function getUser(params: { id: string }): Promise<Result<User>> {
	return callGetApi(getUserEndpoint, {
		pathParams: { id: params.id },
	});
}

/**
 * GET /users
 * ユーザー一覧を取得（クエリパラメータでフィルタリング）
 *
 * UI側での使用例:
 * ```ts
 * const res = await listUsers({ query: { page: 1, limit: 10, role: "admin" } });
 * if (!res.ok) {
 *   console.error(res.error.kind);
 *   return;
 * }
 * console.log(res.data); // User[]
 * ```
 */
export async function listUsers(params?: {
	query?: {
		page?: number;
		limit?: number;
		role?: "admin" | "user" | "guest";
	};
}): Promise<Result<User[]>> {
	return callGetApi(listUsersEndpoint, {
		query: params?.query,
	});
}

/**
 * POST /users
 * 新規ユーザーを作成
 *
 * UI側での使用例:
 * ```ts
 * const res = await createUser({ name: "Alice", email: "alice@example.com" });
 * if (!res.ok) {
 *   // エラーハンドリング
 *   if (res.error.kind === "http" && res.error.status === 409) {
 *     alert("このメールアドレスは既に使用されています");
 *   }
 *   return;
 * }
 * // 成功時の処理
 * console.log("ユーザー作成成功:", res.data.id);
 * ```
 */
export async function createUser(body: {
	name: string;
	email: string;
}): Promise<Result<User>> {
	return callBodyApi(createUserEndpoint, body);
}

/**
 * DELETE /users/:id
 * 指定IDのユーザーを削除
 *
 * UI側での使用例:
 * ```ts
 * const res = await deleteUser({ id: "123" });
 * if (!res.ok) {
 *   console.error(res.error.kind);
 *   return;
 * }
 * console.log("削除成功:", res.data.success);
 * ```
 */
export async function deleteUser(params: {
	id: string;
}): Promise<Result<{ success: boolean }>> {
	return callNoBodyApi(deleteUserEndpoint, {
		pathParams: { id: params.id },
	});
}
