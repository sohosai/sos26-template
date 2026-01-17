import { z } from "zod";
import { ErrorCode } from "./code";

/**
 * ErrorCode のZodスキーマ
 */
export const errorCodeSchema = z.enum([
	ErrorCode.UNAUTHORIZED,
	ErrorCode.FORBIDDEN,
	ErrorCode.NOT_FOUND,
	ErrorCode.ALREADY_EXISTS,
	ErrorCode.VALIDATION_ERROR,
	ErrorCode.INVALID_REQUEST,
	ErrorCode.INTERNAL,
]);

/**
 * APIエラーレスポンスのZodスキーマ
 *
 * バックエンドからフロントエンドへ返されるエラーの契約
 * すべてのAPIエラーはこの形式で返却される
 */
export const apiErrorResponseSchema = z.object({
	error: z.object({
		code: errorCodeSchema,
		message: z.string(),
		/** 追加情報（バリデーションエラー詳細など） */
		details: z.record(z.string(), z.unknown()).optional(),
	}),
});

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
