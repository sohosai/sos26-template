import {
	createUserEndpoint,
	deleteUserEndpoint,
	getUserEndpoint,
	listUsersEndpoint,
	type User,
	type UserRole,
} from "@sos26/shared";
import { callBodyApi, callGetApi, callNoBodyApi } from "./core";

/**
 * GET /users/:id
 * 指定IDのユーザーを取得
 *
 * 成功時: User を返す
 * 失敗時: ClientError を throw
 *
 * TanStack Query での使用例:
 * ```ts
 * const { data, error, isLoading } = useQuery({
 *   queryKey: ["user", id],
 *   queryFn: () => getUser({ id }),
 * });
 *
 * if (error && isClientError(error)) {
 *   if (error.code === ErrorCode.NOT_FOUND) {
 *     return <div>ユーザーが見つかりません</div>;
 *   }
 * }
 * ```
 */
export async function getUser(params: { id: string }): Promise<User> {
	return callGetApi(getUserEndpoint, {
		pathParams: { id: params.id },
	});
}

/**
 * GET /users
 * ユーザー一覧を取得（クエリパラメータでフィルタリング）
 *
 * 成功時: User[] を返す
 * 失敗時: ClientError を throw
 */
export async function listUsers(params?: {
	query?: {
		page?: number;
		limit?: number;
		role?: UserRole;
	};
}): Promise<User[]> {
	return callGetApi(listUsersEndpoint, {
		query: params?.query,
	});
}

/**
 * POST /users
 * 新規ユーザーを作成
 *
 * 成功時: User を返す
 * 失敗時: ClientError を throw
 *
 * TanStack Query Mutation での使用例:
 * ```ts
 * const mutation = useMutation({
 *   mutationFn: createUser,
 *   onError: (error) => {
 *     if (isClientError(error) && error.code === ErrorCode.ALREADY_EXISTS) {
 *       alert("このメールアドレスは既に使用されています");
 *     }
 *   },
 * });
 * ```
 */
export async function createUser(body: {
	name: string;
	email: string;
	role: UserRole;
}): Promise<User> {
	return callBodyApi(createUserEndpoint, body);
}

/**
 * DELETE /users/:id
 * 指定IDのユーザーを削除
 *
 * 成功時: { success: boolean } を返す
 * 失敗時: ClientError を throw
 */
export async function deleteUser(params: {
	id: string;
}): Promise<{ success: boolean }> {
	return callNoBodyApi(deleteUserEndpoint, {
		pathParams: { id: params.id },
	});
}
