import type { Endpoint } from "@sos26/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ClientErrorClass, isClientError } from "../http/error";
import { callBodyApi, callGetApi, callNoBodyApi } from "./core";

// httpClientのモック
vi.mock("../http/client", () => ({
	httpClient: vi.fn(),
}));

// モックされたhttpClientをインポート
import { httpClient } from "../http/client";

describe("callGetApi", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("正常系", () => {
		it("pathパラメータなし、queryなしでGETリクエストを実行する", async () => {
			// Arrange
			const mockResponse = { id: "123", name: "Alice" };
			const mockGet = vi.fn().mockReturnValue({
				json: vi.fn().mockResolvedValue(mockResponse),
			});
			vi.mocked(httpClient).get = mockGet;

			const userSchema = z.object({
				id: z.string(),
				name: z.string(),
			});

			const endpoint: Endpoint<
				"GET",
				"/users",
				undefined,
				undefined,
				undefined,
				typeof userSchema
			> = {
				method: "GET",
				path: "/users",
				pathParams: undefined,
				query: undefined,
				request: undefined,
				response: userSchema,
			};

			// Act
			const result = await callGetApi(endpoint);

			// Assert
			expect(mockGet).toHaveBeenCalledWith("users", {
				searchParams: undefined,
			});
			expect(result).toEqual(mockResponse);
		});

		it("pathパラメータありでGETリクエストを実行する", async () => {
			// Arrange
			const mockResponse = { id: "456", name: "Bob" };
			const mockGet = vi.fn().mockReturnValue({
				json: vi.fn().mockResolvedValue(mockResponse),
			});
			vi.mocked(httpClient).get = mockGet;

			const pathParamsSchema = z.object({ id: z.string() });
			const userSchema = z.object({
				id: z.string(),
				name: z.string(),
			});

			const endpoint: Endpoint<
				"GET",
				"/users/:id",
				typeof pathParamsSchema,
				undefined,
				undefined,
				typeof userSchema
			> = {
				method: "GET",
				path: "/users/:id",
				pathParams: pathParamsSchema,
				query: undefined,
				request: undefined,
				response: userSchema,
			};

			// Act
			const result = await callGetApi(endpoint, {
				pathParams: { id: "456" },
			});

			// Assert
			expect(mockGet).toHaveBeenCalledWith("users/456", {
				searchParams: undefined,
			});
			expect(result).toEqual(mockResponse);
		});

		it("queryパラメータありでGETリクエストを実行する", async () => {
			// Arrange
			const mockResponse = [{ id: "1", name: "Alice" }];
			const mockGet = vi.fn().mockReturnValue({
				json: vi.fn().mockResolvedValue(mockResponse),
			});
			vi.mocked(httpClient).get = mockGet;

			const querySchema = z.object({
				page: z.number().optional(),
				limit: z.number().optional(),
			});
			const usersSchema = z.array(
				z.object({ id: z.string(), name: z.string() })
			);

			const endpoint: Endpoint<
				"GET",
				"/users",
				undefined,
				typeof querySchema,
				undefined,
				typeof usersSchema
			> = {
				method: "GET",
				path: "/users",
				pathParams: undefined,
				query: querySchema,
				request: undefined,
				response: usersSchema,
			};

			// Act
			const result = await callGetApi(endpoint, {
				query: { page: 1, limit: 10 },
			});

			// Assert
			expect(mockGet).toHaveBeenCalledWith("users", {
				searchParams: { page: 1, limit: 10 },
			});
			expect(result).toEqual(mockResponse);
		});

		it("pathパラメータとqueryパラメータの両方でGETリクエストを実行する", async () => {
			// Arrange
			const mockResponse = { id: "789", name: "Charlie", posts: [] };
			const mockGet = vi.fn().mockReturnValue({
				json: vi.fn().mockResolvedValue(mockResponse),
			});
			vi.mocked(httpClient).get = mockGet;

			const pathParamsSchema = z.object({ id: z.string() });
			const querySchema = z.object({ includePosts: z.boolean() });
			const userSchema = z.object({
				id: z.string(),
				name: z.string(),
				posts: z.array(z.unknown()),
			});

			const endpoint: Endpoint<
				"GET",
				"/users/:id",
				typeof pathParamsSchema,
				typeof querySchema,
				undefined,
				typeof userSchema
			> = {
				method: "GET",
				path: "/users/:id",
				pathParams: pathParamsSchema,
				query: querySchema,
				request: undefined,
				response: userSchema,
			};

			// Act
			const result = await callGetApi(endpoint, {
				pathParams: { id: "789" },
				query: { includePosts: true },
			});

			// Assert
			expect(mockGet).toHaveBeenCalledWith("users/789", {
				searchParams: { includePosts: true },
			});
			expect(result).toEqual(mockResponse);
		});

		it("pathパラメータを正しくURLエンコードする", async () => {
			// Arrange
			const mockResponse = { id: "test/value", data: "ok" };
			const mockGet = vi.fn().mockReturnValue({
				json: vi.fn().mockResolvedValue(mockResponse),
			});
			vi.mocked(httpClient).get = mockGet;

			const pathParamsSchema = z.object({ id: z.string() });
			const dataSchema = z.object({ id: z.string(), data: z.string() });

			const endpoint: Endpoint<
				"GET",
				"/data/:id",
				typeof pathParamsSchema,
				undefined,
				undefined,
				typeof dataSchema
			> = {
				method: "GET",
				path: "/data/:id",
				pathParams: pathParamsSchema,
				query: undefined,
				request: undefined,
				response: dataSchema,
			};

			// Act
			const result = await callGetApi(endpoint, {
				pathParams: { id: "test/value" },
			});

			// Assert
			expect(mockGet).toHaveBeenCalledWith("data/test%2Fvalue", {
				searchParams: undefined,
			});
			expect(result).toEqual(mockResponse);
		});

		it("先頭の複数のスラッシュを正しく除去する", async () => {
			// Arrange
			const mockResponse = { success: true };
			const mockGet = vi.fn().mockReturnValue({
				json: vi.fn().mockResolvedValue(mockResponse),
			});
			vi.mocked(httpClient).get = mockGet;

			const successSchema = z.object({ success: z.boolean() });

			const endpoint: Endpoint<
				"GET",
				"///api/test",
				undefined,
				undefined,
				undefined,
				typeof successSchema
			> = {
				method: "GET",
				path: "///api/test",
				pathParams: undefined,
				query: undefined,
				request: undefined,
				response: successSchema,
			};

			// Act
			const result = await callGetApi(endpoint);

			// Assert
			expect(mockGet).toHaveBeenCalledWith("api/test", {
				searchParams: undefined,
			});
			expect(result).toEqual(mockResponse);
		});
	});

	describe("エラー系", () => {
		it("レスポンスのバリデーションに失敗した場合、ClientErrorをthrowする", async () => {
			// Arrange
			const mockResponse = { id: "123", name: 123 }; // nameが数値（期待は文字列）
			const mockGet = vi.fn().mockReturnValue({
				json: vi.fn().mockResolvedValue(mockResponse),
			});
			vi.mocked(httpClient).get = mockGet;

			const userSchema = z.object({
				id: z.string(),
				name: z.string(),
			});

			const endpoint: Endpoint<
				"GET",
				"/users/:id",
				undefined,
				undefined,
				undefined,
				typeof userSchema
			> = {
				method: "GET",
				path: "/users/:id",
				pathParams: undefined,
				query: undefined,
				request: undefined,
				response: userSchema,
			};

			// Act & Assert
			await expect(callGetApi(endpoint)).rejects.toThrow(ClientErrorClass);
			try {
				await callGetApi(endpoint);
			} catch (error) {
				expect(isClientError(error)).toBe(true);
				if (isClientError(error)) {
					expect(error.kind).toBe("unknown");
				}
			}
		});
	});
});

describe("callBodyApi", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("正常系", () => {
		it("POSTリクエストを実行する（pathパラメータなし、queryなし）", async () => {
			// Arrange
			const mockResponse = {
				id: "999",
				name: "New User",
				email: "user@example.com",
			};
			const mockHttpClient = vi.fn().mockReturnValue({
				json: vi.fn().mockResolvedValue(mockResponse),
			});
			vi.mocked(httpClient).mockImplementation(mockHttpClient as never);

			const requestSchema = z.object({
				name: z.string(),
				email: z.string().email(),
			});
			const userSchema = z.object({
				id: z.string(),
				name: z.string(),
				email: z.string(),
			});

			const endpoint: Endpoint<
				"POST",
				"/users",
				undefined,
				undefined,
				typeof requestSchema,
				typeof userSchema
			> = {
				method: "POST",
				path: "/users",
				pathParams: undefined,
				query: undefined,
				request: requestSchema,
				response: userSchema,
			};

			const body = { name: "New User", email: "user@example.com" };

			// Act
			const result = await callBodyApi(endpoint, body);

			// Assert
			expect(mockHttpClient).toHaveBeenCalledWith("users", {
				method: "POST",
				json: body,
				searchParams: undefined,
			});
			expect(result).toEqual(mockResponse);
		});

		it("POSTリクエストを実行する（pathパラメータあり、queryあり）", async () => {
			// Arrange
			const mockResponse = { id: "100", commentId: "200", text: "Hello" };
			const mockHttpClient = vi.fn().mockReturnValue({
				json: vi.fn().mockResolvedValue(mockResponse),
			});
			vi.mocked(httpClient).mockImplementation(mockHttpClient as never);

			const pathParamsSchema = z.object({ userId: z.string() });
			const querySchema = z.object({ notify: z.boolean() });
			const requestSchema = z.object({ text: z.string() });
			const commentSchema = z.object({
				id: z.string(),
				commentId: z.string(),
				text: z.string(),
			});

			const endpoint: Endpoint<
				"POST",
				"/users/:userId/comments",
				typeof pathParamsSchema,
				typeof querySchema,
				typeof requestSchema,
				typeof commentSchema
			> = {
				method: "POST",
				path: "/users/:userId/comments",
				pathParams: pathParamsSchema,
				query: querySchema,
				request: requestSchema,
				response: commentSchema,
			};

			const body = { text: "Hello" };

			// Act
			const result = await callBodyApi(endpoint, body, {
				pathParams: { userId: "100" },
				query: { notify: true },
			});

			// Assert
			expect(mockHttpClient).toHaveBeenCalledWith("users/100/comments", {
				method: "POST",
				json: body,
				searchParams: { notify: true },
			});
			expect(result).toEqual(mockResponse);
		});

		it("PUTリクエストを実行する", async () => {
			// Arrange
			const mockResponse = { id: "456", name: "Updated User" };
			const mockHttpClient = vi.fn().mockReturnValue({
				json: vi.fn().mockResolvedValue(mockResponse),
			});
			vi.mocked(httpClient).mockImplementation(mockHttpClient as never);

			const pathParamsSchema = z.object({ id: z.string() });
			const requestSchema = z.object({ name: z.string() });
			const userSchema = z.object({ id: z.string(), name: z.string() });

			const endpoint: Endpoint<
				"PUT",
				"/users/:id",
				typeof pathParamsSchema,
				undefined,
				typeof requestSchema,
				typeof userSchema
			> = {
				method: "PUT",
				path: "/users/:id",
				pathParams: pathParamsSchema,
				query: undefined,
				request: requestSchema,
				response: userSchema,
			};

			const body = { name: "Updated User" };

			// Act
			const result = await callBodyApi(endpoint, body, {
				pathParams: { id: "456" },
			});

			// Assert
			expect(mockHttpClient).toHaveBeenCalledWith("users/456", {
				method: "PUT",
				json: body,
				searchParams: undefined,
			});
			expect(result).toEqual(mockResponse);
		});

		it("PATCHリクエストを実行する", async () => {
			// Arrange
			const mockResponse = { id: "789", name: "Patched User" };
			const mockHttpClient = vi.fn().mockReturnValue({
				json: vi.fn().mockResolvedValue(mockResponse),
			});
			vi.mocked(httpClient).mockImplementation(mockHttpClient as never);

			const pathParamsSchema = z.object({ id: z.string() });
			const requestSchema = z.object({ name: z.string() });
			const userSchema = z.object({ id: z.string(), name: z.string() });

			const endpoint: Endpoint<
				"PATCH",
				"/users/:id",
				typeof pathParamsSchema,
				undefined,
				typeof requestSchema,
				typeof userSchema
			> = {
				method: "PATCH",
				path: "/users/:id",
				pathParams: pathParamsSchema,
				query: undefined,
				request: requestSchema,
				response: userSchema,
			};

			const body = { name: "Patched User" };

			// Act
			const result = await callBodyApi(endpoint, body, {
				pathParams: { id: "789" },
			});

			// Assert
			expect(mockHttpClient).toHaveBeenCalledWith("users/789", {
				method: "PATCH",
				json: body,
				searchParams: undefined,
			});
			expect(result).toEqual(mockResponse);
		});
	});

	describe("エラー系", () => {
		it("リクエストbodyのバリデーションに失敗した場合、ClientErrorをthrowする", async () => {
			// Arrange
			const requestSchema = z.object({
				name: z.string(),
				email: z.string().email(),
			});
			const userSchema = z.object({
				id: z.string(),
				name: z.string(),
				email: z.string(),
			});

			const endpoint: Endpoint<
				"POST",
				"/users",
				undefined,
				undefined,
				typeof requestSchema,
				typeof userSchema
			> = {
				method: "POST",
				path: "/users",
				pathParams: undefined,
				query: undefined,
				request: requestSchema,
				response: userSchema,
			};

			const invalidBody = { name: "User", email: "invalid-email" }; // 不正なemail形式

			// Act & Assert
			await expect(callBodyApi(endpoint, invalidBody as never)).rejects.toThrow(
				ClientErrorClass
			);
		});

		it("レスポンスのバリデーションに失敗した場合、ClientErrorをthrowする", async () => {
			// Arrange
			const mockResponse = { id: "999", name: 123 }; // nameが数値（期待は文字列）
			const mockHttpClient = vi.fn().mockReturnValue({
				json: vi.fn().mockResolvedValue(mockResponse),
			});
			vi.mocked(httpClient).mockImplementation(mockHttpClient as never);

			const requestSchema = z.object({ name: z.string() });
			const userSchema = z.object({ id: z.string(), name: z.string() });

			const endpoint: Endpoint<
				"POST",
				"/users",
				undefined,
				undefined,
				typeof requestSchema,
				typeof userSchema
			> = {
				method: "POST",
				path: "/users",
				pathParams: undefined,
				query: undefined,
				request: requestSchema,
				response: userSchema,
			};

			const body = { name: "User" };

			// Act & Assert
			await expect(callBodyApi(endpoint, body)).rejects.toThrow(
				ClientErrorClass
			);
		});
	});
});

describe("callNoBodyApi", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("正常系", () => {
		it("DELETEリクエストを実行する", async () => {
			// Arrange
			const mockResponse = { success: true };
			const mockHttpClient = vi.fn().mockReturnValue({
				json: vi.fn().mockResolvedValue(mockResponse),
			});
			vi.mocked(httpClient).mockImplementation(mockHttpClient as never);

			const pathParamsSchema = z.object({ id: z.string() });
			const responseSchema = z.object({ success: z.boolean() });

			const endpoint: Endpoint<
				"DELETE",
				"/users/:id",
				typeof pathParamsSchema,
				undefined,
				undefined,
				typeof responseSchema
			> = {
				method: "DELETE",
				path: "/users/:id",
				pathParams: pathParamsSchema,
				query: undefined,
				request: undefined,
				response: responseSchema,
			};

			// Act
			const result = await callNoBodyApi(endpoint, {
				pathParams: { id: "123" },
			});

			// Assert
			expect(mockHttpClient).toHaveBeenCalledWith("users/123", {
				method: "DELETE",
				searchParams: undefined,
			});
			expect(result).toEqual(mockResponse);
		});

		it("HEADリクエストを実行する", async () => {
			// Arrange
			const mockResponse = { exists: true };
			const mockHttpClient = vi.fn().mockReturnValue({
				json: vi.fn().mockResolvedValue(mockResponse),
			});
			vi.mocked(httpClient).mockImplementation(mockHttpClient as never);

			const pathParamsSchema = z.object({ id: z.string() });
			const responseSchema = z.object({ exists: z.boolean() });

			const endpoint: Endpoint<
				"HEAD",
				"/users/:id",
				typeof pathParamsSchema,
				undefined,
				undefined,
				typeof responseSchema
			> = {
				method: "HEAD",
				path: "/users/:id",
				pathParams: pathParamsSchema,
				query: undefined,
				request: undefined,
				response: responseSchema,
			};

			// Act
			const result = await callNoBodyApi(endpoint, {
				pathParams: { id: "456" },
			});

			// Assert
			expect(mockHttpClient).toHaveBeenCalledWith("users/456", {
				method: "HEAD",
				searchParams: undefined,
			});
			expect(result).toEqual(mockResponse);
		});

		it("queryパラメータありでDELETEリクエストを実行する", async () => {
			// Arrange
			const mockResponse = { deleted: 5 };
			const mockHttpClient = vi.fn().mockReturnValue({
				json: vi.fn().mockResolvedValue(mockResponse),
			});
			vi.mocked(httpClient).mockImplementation(mockHttpClient as never);

			const querySchema = z.object({ cascade: z.boolean() });
			const responseSchema = z.object({ deleted: z.number() });

			const endpoint: Endpoint<
				"DELETE",
				"/posts",
				undefined,
				typeof querySchema,
				undefined,
				typeof responseSchema
			> = {
				method: "DELETE",
				path: "/posts",
				pathParams: undefined,
				query: querySchema,
				request: undefined,
				response: responseSchema,
			};

			// Act
			const result = await callNoBodyApi(endpoint, {
				query: { cascade: true },
			});

			// Assert
			expect(mockHttpClient).toHaveBeenCalledWith("posts", {
				method: "DELETE",
				searchParams: { cascade: true },
			});
			expect(result).toEqual(mockResponse);
		});
	});

	describe("エラー系", () => {
		it("レスポンスのバリデーションに失敗した場合、ClientErrorをthrowする", async () => {
			// Arrange
			const mockResponse = { success: "yes" }; // successがstring（期待はboolean）
			const mockHttpClient = vi.fn().mockReturnValue({
				json: vi.fn().mockResolvedValue(mockResponse),
			});
			vi.mocked(httpClient).mockImplementation(mockHttpClient as never);

			const pathParamsSchema = z.object({ id: z.string() });
			const responseSchema = z.object({ success: z.boolean() });

			const endpoint: Endpoint<
				"DELETE",
				"/users/:id",
				typeof pathParamsSchema,
				undefined,
				undefined,
				typeof responseSchema
			> = {
				method: "DELETE",
				path: "/users/:id",
				pathParams: pathParamsSchema,
				query: undefined,
				request: undefined,
				response: responseSchema,
			};

			// Act & Assert
			await expect(
				callNoBodyApi(endpoint, {
					pathParams: { id: "123" },
				})
			).rejects.toThrow(ClientErrorClass);
		});
	});
});
