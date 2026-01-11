import { HTTPError, TimeoutError } from "ky";
import { ZodError } from "zod";

/**
 * エラー発生時のコンテキスト情報
 * デバッグ時にどのAPIエンドポイントでエラーが発生したかを特定できる
 */
export type ErrorContext = {
	method?: string;
	path?: string;
};

/**
 * API通信で発生する全てのエラーを表す discriminated union
 *
 * kind による分岐で、UI側で適切なエラーハンドリングが可能
 * context フィールドにより、どのAPIでエラーが発生したかを追跡可能
 */
export type ApiError =
	| {
			kind: "http";
			status: number;
			statusText: string;
			body?: unknown;
			context?: ErrorContext;
	  }
	| {
			kind: "timeout";
			context?: ErrorContext;
	  }
	| {
			kind: "network";
			message: string;
			context?: ErrorContext;
	  }
	| {
			kind: "invalid_response";
			issues: ZodError["issues"];
			context?: ErrorContext;
	  }
	| {
			kind: "unknown";
			error: unknown;
			context?: ErrorContext;
	  };

/**
 * kyやzodが投げる各種エラーを統一型 ApiError に変換する
 *
 * この関数により、UI層はエラーの種類を意識せず kind で分岐できる
 *
 * @param error - 変換対象のエラー
 * @param context - エラー発生時のコンテキスト情報（デバッグ用）
 */
export async function toApiError(
	error: unknown,
	context?: ErrorContext
): Promise<ApiError> {
	// HTTPエラー（4xx, 5xx）
	if (error instanceof HTTPError) {
		// レスポンスbodyのパースを試みる
		let body: unknown;
		try {
			// responseのクローンを作成してパース（元のレスポンスストリームを消費しないため）
			const clonedResponse = error.response.clone();
			const contentType = clonedResponse.headers.get("content-type");

			// Content-Typeに応じてパース方法を変える
			if (contentType?.includes("application/json")) {
				body = await clonedResponse.json();
			} else {
				// JSONでない場合はテキストとして取得
				body = await clonedResponse.text();
			}
		} catch {
			// パースに失敗した場合はundefined
			body = undefined;
		}

		return {
			kind: "http",
			status: error.response.status,
			statusText: error.response.statusText,
			body,
			context,
		};
	}

	// タイムアウトエラー
	if (error instanceof TimeoutError) {
		return {
			kind: "timeout",
			context,
		};
	}

	// zodバリデーションエラー（レスポンス不正）
	if (error instanceof ZodError) {
		return {
			kind: "invalid_response",
			issues: error.issues,
			context,
		};
	}

	// ネットワークエラー（fetch由来のTypeError）
	if (error instanceof TypeError) {
		return {
			kind: "network",
			message: error.message,
			context,
		};
	}

	// その他の予期しないエラー
	return {
		kind: "unknown",
		error,
		context,
	};
}
