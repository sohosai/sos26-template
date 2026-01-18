import { z } from "zod";

const envSchema = z.object({
	PORT: z.coerce.number().int().min(1).max(65535).default(3000),
	CORS_ORIGIN: z
		.string()
		.default("")
		.transform(val =>
			val
				.split(",")
				.map(o => o.trim())
				.filter(Boolean)
		)
		.refine(
			origins => origins.every(o => /^https?:\/\/.+/.test(o)),
			"各オリジンは有効なURL（http://またはhttps://で始まる）である必要があります"
		),
});

export const env = envSchema.parse({
	PORT: process.env.PORT,
	CORS_ORIGIN: process.env.CORS_ORIGIN,
});

export type Env = z.infer<typeof envSchema>;
