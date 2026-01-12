import { type ApiError, type ErrorContext, toApiError } from "./error";

/**
 * 成功/失敗を表す Result 型（discriminated union）
 *
 * UI側では try/catch を書かず、if (!res.ok) で分岐できる
 */
export type Result<T> =
	| {
			ok: true;
			data: T;
	  }
	| {
			ok: false;
			error: ApiError;
	  };

/**
 * Promise<T> を Promise<Result<T>> に変換する
 *
 * 例外を握り潰さず、全てのエラーを ApiError に変換して返す
 * UI側は例外を意識せず、Result の ok で分岐できる
 *
 * @param promise - 変換対象のPromise
 * @param context - エラー発生時のコンテキスト情報（デバッグ用）
 *
 * @example
 * // コンテキスト情報なし（シンプル）
 * return toResult(callGetApi(getUserEndpoint, { pathParams: { id } }));
 *
 * @example
 * // コンテキスト情報あり（デバッグしやすい）
 * return toResult(
 *   callGetApi(getUserEndpoint, { pathParams: { id } }),
 *   { method: "GET", path: `/users/${id}` }
 * );
 */
export async function toResult<T>(
	promise: Promise<T>,
	context?: ErrorContext
): Promise<Result<T>> {
	try {
		const data = await promise;
		return {
			ok: true,
			data,
		};
	} catch (error) {
		return {
			ok: false,
			error: await toApiError(error, context),
		};
	}
}
