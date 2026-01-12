import { describe, expect, it } from "vitest";
import { userSchema } from "./user";

describe("userSchema", () => {
	it("有効なユーザー情報を受け入れる", () => {
		const validUser = {
			id: "1",
			name: "John Doe",
			email: "john@example.com",
		};

		const result = userSchema.safeParse(validUser);
		expect(result.success).toBe(true);
	});

	it("無効なメールアドレスを拒否する", () => {
		const invalidUser = {
			id: "1",
			name: "John Doe",
			email: "invalid-email",
		};

		const result = userSchema.safeParse(invalidUser);
		expect(result.success).toBe(false);
	});
});
