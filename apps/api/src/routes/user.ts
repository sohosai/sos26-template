import { userSchema } from "@sos26/shared";
import { Hono } from "hono";
import type { z } from "zod";

type User = z.infer<typeof userSchema>;

// In-memory store for demo
const db: { users: User[] } = {
	users: [
		{ id: "u_1", name: "Alice", email: "alice@example.com" },
		{ id: "u_2", name: "Bob", email: "bob@example.com" },
	],
};

export const userRoute = new Hono();

// GET /users
userRoute.get("/users", c => c.json(db.users));

// GET /users/:id
userRoute.get("/users/:id", c => {
	const id = c.req.param("id");
	const user = db.users.find(u => u.id === id);
	if (!user) return c.json({ message: "Not Found" }, 404);
	return c.json(user);
});

// POST /users
userRoute.post("/users", async c => {
	const body = await c.req.json().catch(() => ({}));
	const parsed = userSchema.pick({ name: true, email: true }).parse(body);
	const newUser: User = {
		id: `u_${Date.now()}`,
		name: parsed.name,
		email: parsed.email,
	};
	db.users.push(newUser);
	return c.json(newUser, 201);
});

// DELETE /users/:id
userRoute.delete("/users/:id", c => {
	const id = c.req.param("id");
	const idx = db.users.findIndex(u => u.id === id);
	if (idx === -1) return c.json({ success: false }, 404);
	db.users.splice(idx, 1);
	return c.json({ success: true });
});
