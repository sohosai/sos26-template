import { z } from "zod";

const envSchema = z.object({
	VITE_API_BASE_URL: z
		.string()
		.regex(/^https?:\/\/.+/, "有効なURLである必要があります")
		.default("http://localhost:3000"),
});

export const env = envSchema.parse({
	VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
});

export type Env = z.infer<typeof envSchema>;
