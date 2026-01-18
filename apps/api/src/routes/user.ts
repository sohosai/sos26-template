import {
	createUserEndpoint,
	listUsersEndpoint,
	type User,
} from "@sos26/shared";
import { Hono } from "hono";
import { Errors } from "../lib/error";

// In-memory store for demo
const db: { users: User[] } = {
	users: [
		{ id: "u_1", name: "Alice", email: "alice@example.com", role: "admin" },
		{ id: "u_2", name: "Bob", email: "bob@example.com", role: "user" },
		{ id: "u_3", name: "Charlie", email: "charlie@example.com", role: "guest" },
	],
};

export const userRoute = new Hono();

// GET /users
userRoute.get("/users", c => {
	// Endpoint定義のクエリスキーマで検証
	const query = listUsersEndpoint.query.parse({
		page: c.req.query("page"),
		limit: c.req.query("limit"),
		role: c.req.query("role"),
	});

	let result = db.users;

	// roleでフィルタリング
	if (query.role) {
		result = result.filter(u => u.role === query.role);
	}

	// ページネーション
	const page = query.page ?? 1;
	const limit = query.limit ?? 10;
	const start = (page - 1) * limit;
	result = result.slice(start, start + limit);

	return c.json(result);
});

// GET /users/:id
userRoute.get("/users/:id", c => {
	const id = c.req.param("id");
	const user = db.users.find(u => u.id === id);
	if (!user) {
		throw Errors.notFound("ユーザーが見つかりません");
	}
	return c.json(user);
});

// POST /users
userRoute.post("/users", async c => {
	const body = await c.req.json().catch(() => ({}));
	// Endpoint定義のrequestスキーマで検証（zodのparseはthrowするので、onErrorでVALIDATION_ERRORに変換される）
	const parsed = createUserEndpoint.request.parse(body);

	// メールアドレスの重複チェック
	const existingUser = db.users.find(u => u.email === parsed.email);
	if (existingUser) {
		throw Errors.alreadyExists("このメールアドレスは既に使用されています");
	}

	const newUser: User = {
		id: `u_${Date.now()}`,
		name: parsed.name,
		email: parsed.email,
		role: parsed.role,
	};
	db.users.push(newUser);
	return c.json(newUser, 201);
});

// DELETE /users/:id
userRoute.delete("/users/:id", c => {
	const id = c.req.param("id");
	const idx = db.users.findIndex(u => u.id === id);
	if (idx === -1) {
		throw Errors.notFound("ユーザーが見つかりません");
	}
	db.users.splice(idx, 1);
	return c.json({ success: true });
});
