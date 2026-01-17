import { ErrorCode } from "@sos26/shared";
import { HTTPError, TimeoutError } from "ky";
import { describe, expect, it } from "vitest";
import {
	type ClientError,
	ClientErrorClass,
	isClientError,
	throwClientError,
} from "./error";

describe("ClientErrorClass", () => {
	describe("constructor", () => {
		it("APIエラーの場合、messageにerror.error.messageを設定する", () => {
			const clientError: ClientError = {
				kind: "api",
				error: {
					error: {
						code: ErrorCode.NOT_FOUND,
						message: "ユーザーが見つかりません",
					},
				},
			};
			const error = new ClientErrorClass(clientError);

			expect(error.message).toBe("ユーザーが見つかりません");
			expect(error.name).toBe("ClientError");
		});

		it("非APIエラーの場合、messageにclientError.messageを設定する", () => {
			const clientError: ClientError = {
				kind: "network",
				message: "ネットワークエラー",
			};
			const error = new ClientErrorClass(clientError);

			expect(error.message).toBe("ネットワークエラー");
		});
	});

	describe("kind getter", () => {
		it("clientErrorのkindを返す", () => {
			const apiError = new ClientErrorClass({
				kind: "api",
				error: { error: { code: ErrorCode.INTERNAL, message: "error" } },
			});
			const networkError = new ClientErrorClass({
				kind: "network",
				message: "error",
			});

			expect(apiError.kind).toBe("api");
			expect(networkError.kind).toBe("network");
		});
	});

	describe("code getter", () => {
		it("APIエラーの場合、ErrorCodeを返す", () => {
			const error = new ClientErrorClass({
				kind: "api",
				error: { error: { code: ErrorCode.UNAUTHORIZED, message: "error" } },
			});

			expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
		});

		it("非APIエラーの場合、undefinedを返す", () => {
			const error = new ClientErrorClass({
				kind: "timeout",
				message: "timeout",
			});

			expect(error.code).toBeUndefined();
		});
	});

	describe("apiError getter", () => {
		it("APIエラーの場合、ApiErrorResponseを返す", () => {
			const apiErrorResponse = {
				error: {
					code: ErrorCode.FORBIDDEN,
					message: "権限がありません",
					details: { required: "admin" },
				},
			};
			const error = new ClientErrorClass({
				kind: "api",
				error: apiErrorResponse,
			});

			expect(error.apiError).toEqual(apiErrorResponse);
		});

		it("非APIエラーの場合、undefinedを返す", () => {
			const error = new ClientErrorClass({
				kind: "abort",
				message: "aborted",
			});

			expect(error.apiError).toBeUndefined();
		});
	});
});

describe("isClientError", () => {
	it("ClientErrorClassインスタンスの場合、trueを返す", () => {
		const error = new ClientErrorClass({ kind: "network", message: "error" });

		expect(isClientError(error)).toBe(true);
	});

	it("通常のErrorの場合、falseを返す", () => {
		const error = new Error("normal error");

		expect(isClientError(error)).toBe(false);
	});

	it("nullの場合、falseを返す", () => {
		expect(isClientError(null)).toBe(false);
	});

	it("undefinedの場合、falseを返す", () => {
		expect(isClientError(undefined)).toBe(false);
	});

	it("文字列の場合、falseを返す", () => {
		expect(isClientError("error string")).toBe(false);
	});
});

describe("throwClientError", () => {
	it("TimeoutErrorをkind: timeoutに変換する", async () => {
		const timeoutError = new TimeoutError(new Request("https://example.com"));

		await expect(throwClientError(timeoutError)).rejects.toMatchObject({
			clientError: {
				kind: "timeout",
				message: "リクエストがタイムアウトしました",
			},
		});
	});

	it("AbortErrorをkind: abortに変換する", async () => {
		const abortError = new DOMException("aborted", "AbortError");

		await expect(throwClientError(abortError)).rejects.toMatchObject({
			clientError: {
				kind: "abort",
				message: "リクエストが中断されました",
			},
		});
	});

	it("TypeErrorをkind: networkに変換する", async () => {
		const typeError = new TypeError("Failed to fetch");

		await expect(throwClientError(typeError)).rejects.toMatchObject({
			clientError: {
				kind: "network",
				message: "ネットワークエラーが発生しました",
			},
		});
	});

	it("その他のErrorをkind: unknownに変換する", async () => {
		const error = new Error("some error");

		await expect(throwClientError(error)).rejects.toMatchObject({
			clientError: {
				kind: "unknown",
				message: "some error",
			},
		});
	});

	it("非Errorをkind: unknownに変換する", async () => {
		await expect(throwClientError("string error")).rejects.toMatchObject({
			clientError: {
				kind: "unknown",
				message: "不明なエラーが発生しました",
			},
		});
	});

	it("HTTPErrorでJSONレスポンスがApiErrorResponse形式の場合、kind: apiに変換する", async () => {
		const apiErrorBody = {
			error: {
				code: "NOT_FOUND",
				message: "リソースが見つかりません",
			},
		};
		const response = new Response(JSON.stringify(apiErrorBody), {
			status: 404,
			statusText: "Not Found",
			headers: { "Content-Type": "application/json" },
		});
		const httpError = new HTTPError(
			response,
			new Request("https://example.com"),
			{} as any
		);

		await expect(throwClientError(httpError)).rejects.toMatchObject({
			clientError: {
				kind: "api",
				error: apiErrorBody,
			},
		});
	});

	it("HTTPErrorでJSONレスポンスが不正な形式の場合、kind: unknownに変換する", async () => {
		const response = new Response(JSON.stringify({ invalid: "format" }), {
			status: 500,
			statusText: "Internal Server Error",
			headers: { "Content-Type": "application/json" },
		});
		const httpError = new HTTPError(
			response,
			new Request("https://example.com"),
			{} as any
		);

		await expect(throwClientError(httpError)).rejects.toMatchObject({
			clientError: {
				kind: "unknown",
				message: "HTTP 500: Internal Server Error",
			},
		});
	});

	it("HTTPErrorで非JSONレスポンスの場合、kind: unknownに変換する", async () => {
		const response = new Response("Internal Server Error", {
			status: 500,
			statusText: "Internal Server Error",
			headers: { "Content-Type": "text/plain" },
		});
		const httpError = new HTTPError(
			response,
			new Request("https://example.com"),
			{} as any
		);

		await expect(throwClientError(httpError)).rejects.toMatchObject({
			clientError: {
				kind: "unknown",
				message: "HTTP 500: Internal Server Error",
			},
		});
	});
});
