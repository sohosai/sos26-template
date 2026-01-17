import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { Button } from "@/components/Button";
import { listUsers } from "@/lib/api/user";
import { type ClientError, isClientError } from "@/lib/http/error";

export const Route = createFileRoute("/")({
	component: Index,
	head: () => ({
		meta: [
			{
				title: "雙峰祭オンラインシステム",
			},
			{
				name: "description",
				content: "Sohosai Online System",
			},
		],
	}),
});

/**
 * ClientError をユーザーフレンドリーなメッセージに変換
 *
 * 使用例:
 * - kind === "api" の場合は error.error.code で分岐
 * - その他の kind は直接分岐
 */
function formatErrorMessage(err: ClientError): string {
	switch (err.kind) {
		case "api":
			// APIエラーの場合は code で分岐
			return `${err.error.error.code}: ${err.error.error.message}`;
		case "timeout":
			return err.message;
		case "network":
			return err.message;
		case "abort":
			return err.message;
		case "unknown":
			return err.message;
	}
}

function Index() {
	const [loading, setLoading] = useState(false);
	const [output, setOutput] = useState<string>("結果がここに表示されます");

	const handleFetchUsers = useCallback(async () => {
		setLoading(true);
		setOutput("Loading...");
		try {
			// 成功時: User[] が返る
			// 失敗時: ClientError が throw される
			const users = await listUsers();
			setOutput(JSON.stringify(users, null, 2));
		} catch (error) {
			// ClientError かどうかを判定
			if (isClientError(error)) {
				setOutput(`Error: ${formatErrorMessage(error.clientError)}`);
			} else {
				setOutput("Unknown error occurred");
			}
		} finally {
			setLoading(false);
		}
	}, []);

	return (
		<div>
			<h1>Welcome Sohosai Online System!</h1>
			<div>
				<Button onClick={handleFetchUsers} disabled={loading}>
					ユーザー一覧を取得
				</Button>
			</div>
			<div>
				API: {import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000"}
			</div>
			<pre>{output}</pre>
		</div>
	);
}
