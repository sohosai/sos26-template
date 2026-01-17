/**
 * APIエラーコード定義
 *
 * フロントエンド・バックエンド間で共有されるエラーコード
 * UI分岐は必ずこの code で行う（message 文字列での分岐は禁止）
 */
export const ErrorCode = {
	// 認証・認可エラー
	UNAUTHORIZED: "UNAUTHORIZED",
	FORBIDDEN: "FORBIDDEN",

	// リソースエラー
	NOT_FOUND: "NOT_FOUND",
	ALREADY_EXISTS: "ALREADY_EXISTS",

	// バリデーションエラー
	VALIDATION_ERROR: "VALIDATION_ERROR",
	INVALID_REQUEST: "INVALID_REQUEST",

	// サーバーエラー
	INTERNAL: "INTERNAL",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * ErrorCode から HTTP ステータスコードへのマッピング
 */
export const ErrorCodeToStatus: Record<ErrorCode, number> = {
	[ErrorCode.UNAUTHORIZED]: 401,
	[ErrorCode.FORBIDDEN]: 403,
	[ErrorCode.NOT_FOUND]: 404,
	[ErrorCode.ALREADY_EXISTS]: 409,
	[ErrorCode.VALIDATION_ERROR]: 400,
	[ErrorCode.INVALID_REQUEST]: 400,
	[ErrorCode.INTERNAL]: 500,
};
