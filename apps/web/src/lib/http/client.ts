import ky from "ky";
import { env } from "../env";

/**
 * 認証トークン取得
 * ⚠️ TODO: 認証機能実装時に必ず変更すること
 */
function getAuthToken(): string | null {
	return localStorage.getItem("auth_token");
}

// ky共通クライアント。prefixUrl・timeout・retry・認証ヘッダを設定
export const httpClient = ky.create({
	prefixUrl: env.VITE_API_BASE_URL,
	timeout: 10000,
	retry: {
		limit: 1,
		methods: ["get", "put", "head", "delete", "options", "trace"],
		statusCodes: [408, 413, 429, 500, 502, 503, 504],
	},
	hooks: {
		beforeRequest: [
			request => {
				const token = getAuthToken();
				if (token) {
					request.headers.set("Authorization", `Bearer ${token}`);
				}
			},
		],
	},
});
