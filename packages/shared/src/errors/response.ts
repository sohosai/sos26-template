import { z } from "zod";
import { ERROR_CODES } from "./code";

/**
 * ErrorCode のZodスキーマ
 */
export const errorCodeSchema = z.enum(ERROR_CODES);

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
