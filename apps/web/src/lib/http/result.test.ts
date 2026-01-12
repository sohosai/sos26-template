import { HTTPError } from "ky";
import { describe, expect, it } from "vitest";
import { toResult } from "./result";

describe("toResult", () => {
	describe("成功ケース", () => {
		it("Promiseが解決した場合、ok=trueのResultを返す", async () => {
			// Arrange
			const successData = { id: "123", name: "Alice" };
			const promise = Promise.resolve(successData);

			// Act
			const result = await toResult(promise);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.data).toEqual(successData);
			}
		});

		it("文字列を返すPromiseを正しく処理する", async () => {
			// Arrange
			const promise = Promise.resolve("success message");

			// Act
			const result = await toResult(promise);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.data).toBe("success message");
			}
		});

		it("数値を返すPromiseを正しく処理する", async () => {
			// Arrange
			const promise = Promise.resolve(42);

			// Act
			const result = await toResult(promise);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.data).toBe(42);
			}
		});

		it("配列を返すPromiseを正しく処理する", async () => {
			// Arrange
			const dataArray = [
				{ id: "1", name: "Alice" },
				{ id: "2", name: "Bob" },
			];
			const promise = Promise.resolve(dataArray);

			// Act
			const result = await toResult(promise);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.data).toEqual(dataArray);
			}
		});

		it("nullを返すPromiseを正しく処理する", async () => {
			// Arrange
			const promise = Promise.resolve(null);

			// Act
			const result = await toResult(promise);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.data).toBeNull();
			}
		});
	});

	describe("失敗ケース", () => {
		it("Promiseが拒否された場合、ok=falseのResultを返す", async () => {
			// Arrange
			const error = new Error("Something went wrong");
			const promise = Promise.reject(error);

			// Act
			const result = await toResult(promise);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error.kind).toBe("unknown");
			}
		});

		it("HTTPErrorを適切に変換する", async () => {
			// Arrange
			// Note: HTTPErrorを直接インスタンス化するのは複雑なため、
			// 実際のkyの呼び出しを使った統合テストで検証する
			const mockRequest = new Request("http://example.com/users/123");
			const mockResponse = new Response(null, {
				status: 404,
				statusText: "Not Found",
			});
			// HTTPErrorのモック（実際のエラーに近い構造）
			const httpError = Object.assign(new Error("HTTP Error"), {
				response: mockResponse,
				request: mockRequest,
				name: "HTTPError",
			});
			// HTTPErrorであることを示すために、instanceofチェックをパスさせる
			Object.setPrototypeOf(httpError, HTTPError.prototype);
			const promise = Promise.reject(httpError);

			// Act
			const result = await toResult(promise);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error.kind).toBe("http");
				if (result.error.kind === "http") {
					expect(result.error.status).toBe(404);
					expect(result.error.statusText).toBe("Not Found");
				}
			}
		});

		it("文字列のエラーを適切に処理する", async () => {
			// Arrange
			const promise = Promise.reject("Error message");

			// Act
			const result = await toResult(promise);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error.kind).toBe("unknown");
			}
		});
	});

	describe("コンテキスト情報の付与", () => {
		it("コンテキスト情報を正しく設定する", async () => {
			// Arrange
			const error = new Error("API Error");
			const promise = Promise.reject(error);
			const context = { method: "GET", path: "/users/123" };

			// Act
			const result = await toResult(promise, context);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error.context).toEqual(context);
			}
		});

		it("コンテキスト情報なしでも動作する", async () => {
			// Arrange
			const error = new Error("API Error");
			const promise = Promise.reject(error);

			// Act
			const result = await toResult(promise);

			// Assert
			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error.context).toBeUndefined();
			}
		});

		it("成功時はコンテキスト情報を無視する", async () => {
			// Arrange
			const promise = Promise.resolve({ success: true });
			const context = { method: "POST", path: "/users" };

			// Act
			const result = await toResult(promise, context);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				// Result成功型にはcontextフィールドがない
				expect("context" in result).toBe(false);
			}
		});
	});

	describe("型推論", () => {
		it("Promise<User>から正しい型を推論する", async () => {
			// Arrange
			type User = { id: string; name: string };
			const user: User = { id: "1", name: "Alice" };
			const promise: Promise<User> = Promise.resolve(user);

			// Act
			const result = await toResult(promise);

			// Assert
			expect(result.ok).toBe(true);
			if (result.ok) {
				// TypeScriptの型推論により、result.dataはUser型
				const userId: string = result.data.id;
				const userName: string = result.data.name;
				expect(userId).toBe("1");
				expect(userName).toBe("Alice");
			}
		});
	});
});
