import ky from "ky";

/**
 * 認証トークン取得
 * ⚠️ TODO: 認証機能実装時に必ず変更すること
 */
function getAuthToken(): string | null {
	return localStorage.getItem("auth_token");
}

/**
 * ky共通クライアント。prefixUrl・timeout・retry・認証ヘッダを設定
 * ⚠️ TODO: 環境変数のバリデーション実装
 */
export const httpClient = ky.create({
	prefixUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api",
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
