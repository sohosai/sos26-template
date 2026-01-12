import { HTTPError, TimeoutError } from "ky";
import { describe, expect, it } from "vitest";
import { type ZodError, z } from "zod";
import { toApiError } from "./error";

describe("toApiError", () => {
	describe("HTTPエラーの変換", () => {
		it("HTTPErrorを正しく変換する（JSONレスポンス）", async () => {
			// Arrange
			const mockRequest = new Request("http://example.com/users/123");
			const mockResponse = new Response(
				JSON.stringify({ message: "Not Found" }),
				{
					status: 404,
					statusText: "Not Found",
					headers: { "content-type": "application/json" },
				}
			);
			// HTTPErrorのモックオブジェクト
			const httpError = Object.assign(new Error("HTTP Error"), {
				response: mockResponse,
				request: mockRequest,
				name: "HTTPError",
			});
			Object.setPrototypeOf(httpError, HTTPError.prototype);
			const context = { method: "GET", path: "/users/123" };

			// Act
			const result = await toApiError(httpError, context);

			// Assert
			expect(result.kind).toBe("http");
			if (result.kind === "http") {
				expect(result.status).toBe(404);
				expect(result.statusText).toBe("Not Found");
				expect(result.body).toEqual({ message: "Not Found" });
				expect(result.context).toEqual(context);
			}
		});

		it("HTTPErrorを正しく変換する（テキストレスポンス）", async () => {
			// Arrange
			const mockRequest = new Request("http://example.com/api");
			const mockResponse = new Response("Internal Server Error", {
				status: 500,
				statusText: "Internal Server Error",
				headers: { "content-type": "text/plain" },
			});
			const httpError = Object.assign(new Error("HTTP Error"), {
				response: mockResponse,
				request: mockRequest,
				name: "HTTPError",
			});
			Object.setPrototypeOf(httpError, HTTPError.prototype);

			// Act
			const result = await toApiError(httpError);

			// Assert
			expect(result.kind).toBe("http");
			if (result.kind === "http") {
				expect(result.status).toBe(500);
				expect(result.statusText).toBe("Internal Server Error");
				expect(result.body).toBe("Internal Server Error");
			}
		});

		it("HTTPErrorを正しく変換する（レスポンスボディのパースに失敗）", async () => {
			// Arrange
			const mockRequest = new Request("http://example.com/api");
			const mockResponse = new Response("invalid json", {
				status: 400,
				statusText: "Bad Request",
				headers: { "content-type": "application/json" },
			});
			const httpError = Object.assign(new Error("HTTP Error"), {
				response: mockResponse,
				request: mockRequest,
				name: "HTTPError",
			});
			Object.setPrototypeOf(httpError, HTTPError.prototype);

			// Act
			const result = await toApiError(httpError);

			// Assert
			expect(result.kind).toBe("http");
			if (result.kind === "http") {
				expect(result.status).toBe(400);
				expect(result.body).toBeUndefined();
			}
		});

		it("コンテキスト情報なしでHTTPErrorを変換できる", async () => {
			// Arrange
			const mockRequest = new Request("http://example.com/api");
			const mockResponse = new Response(null, {
				status: 401,
				statusText: "Unauthorized",
			});
			const httpError = Object.assign(new Error("HTTP Error"), {
				response: mockResponse,
				request: mockRequest,
				name: "HTTPError",
			});
			Object.setPrototypeOf(httpError, HTTPError.prototype);

			// Act
			const result = await toApiError(httpError);

			// Assert
			expect(result.kind).toBe("http");
			if (result.kind === "http") {
				expect(result.status).toBe(401);
				expect(result.context).toBeUndefined();
			}
		});
	});

	describe("タイムアウトエラーの変換", () => {
		it("TimeoutErrorを正しく変換する", async () => {
			// Arrange
			const timeoutError = new TimeoutError(new Request("http://example.com"));
			const context = { method: "POST", path: "/users" };

			// Act
			const result = await toApiError(timeoutError, context);

			// Assert
			expect(result.kind).toBe("timeout");
			if (result.kind === "timeout") {
				expect(result.context).toEqual(context);
			}
		});

		it("コンテキスト情報なしでTimeoutErrorを変換できる", async () => {
			// Arrange
			const timeoutError = new TimeoutError(new Request("http://example.com"));

			// Act
			const result = await toApiError(timeoutError);

			// Assert
			expect(result.kind).toBe("timeout");
			if (result.kind === "timeout") {
				expect(result.context).toBeUndefined();
			}
		});
	});

	describe("Zodバリデーションエラーの変換", () => {
		it("ZodErrorを正しく変換する", async () => {
			// Arrange
			// zodスキーマを使ってエラーを生成
			const schema = z.object({
				name: z.string(),
			});

			let zodError: ZodError | undefined;
			try {
				schema.parse({ name: 123 }); // 意図的にエラーを発生させる
			} catch (error) {
				zodError = error as ZodError;
			}

			const context = { method: "GET", path: "/users/123" };

			// Act
			const result = await toApiError(zodError as ZodError, context);

			// Assert
			expect(result.kind).toBe("invalid_response");
			if (result.kind === "invalid_response") {
				expect(result.issues.length).toBeGreaterThan(0);
				expect(result.context).toEqual(context);
			}
		});

		it("複数のZodエラーを保持する", async () => {
			// Arrange
			const schema = z.object({
				name: z.string(),
				email: z.string().includes("@"),
			});

			let zodError: ZodError | undefined;
			try {
				schema.parse({ name: 123, email: "invalid" });
			} catch (error) {
				zodError = error as ZodError;
			}

			// Act
			const result = await toApiError(zodError as ZodError);

			// Assert
			expect(result.kind).toBe("invalid_response");
			if (result.kind === "invalid_response") {
				expect(result.issues.length).toBeGreaterThan(0);
			}
		});
	});

	describe("ネットワークエラーの変換", () => {
		it("TypeErrorを正しく変換する", async () => {
			// Arrange
			const networkError = new TypeError("Failed to fetch");
			const context = { method: "GET", path: "/users" };

			// Act
			const result = await toApiError(networkError, context);

			// Assert
			expect(result.kind).toBe("network");
			if (result.kind === "network") {
				expect(result.message).toBe("Failed to fetch");
				expect(result.context).toEqual(context);
			}
		});
	});

	describe("不明なエラーの変換", () => {
		it("その他のエラーをunknownとして変換する", async () => {
			// Arrange
			const unknownError = new Error("Unknown error");
			const context = { method: "DELETE", path: "/users/123" };

			// Act
			const result = await toApiError(unknownError, context);

			// Assert
			expect(result.kind).toBe("unknown");
			if (result.kind === "unknown") {
				expect(result.error).toBe(unknownError);
				expect(result.context).toEqual(context);
			}
		});

		it("文字列のエラーもunknownとして変換する", async () => {
			// Arrange
			const stringError = "Something went wrong";

			// Act
			const result = await toApiError(stringError);

			// Assert
			expect(result.kind).toBe("unknown");
			if (result.kind === "unknown") {
				expect(result.error).toBe(stringError);
			}
		});

		it("nullもunknownとして変換する", async () => {
			// Arrange
			const nullError = null;

			// Act
			const result = await toApiError(nullError);

			// Assert
			expect(result.kind).toBe("unknown");
			if (result.kind === "unknown") {
				expect(result.error).toBeNull();
			}
		});
	});
});
