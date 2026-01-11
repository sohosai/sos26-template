import { Hono } from "hono";
import { userRoute } from "./routes/user";

const app = new Hono();

// CORS (開発確認用の簡易版)
app.use("/*", async (c, next) => {
	c.header("Access-Control-Allow-Origin", "*");
	c.header("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,PATCH,OPTIONS");
	c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
	if (c.req.method === "OPTIONS") return c.body(null, 204);
	await next();
});

app.get("/", c => {
	return c.text("Hello Hono!");
});

// Mount routes at root (e.g. http://localhost:3000/users)
app.route("/", userRoute);

export default {
	port: process.env.PORT || 3000,
	fetch: app.fetch,
};
