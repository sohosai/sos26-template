import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { Button } from "@/components/Button";
import { listUsers } from "@/lib/api/user";
import type { ApiError } from "@/lib/http/error";

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

function formatErrorMessage(err: ApiError): string {
	switch (err.kind) {
		case "http":
			return `HTTP ${err.status} ${err.statusText}`;
		case "timeout":
			return "Timeout";
		case "network":
			return `Network: ${err.message}`;
		case "invalid_response": {
			const fields = (err.issues ?? []).map(i => i.path.join(".")).join(", ");
			return `Invalid response: ${fields}`;
		}
		default:
			return "Unknown error";
	}
}

function Index() {
	const [loading, setLoading] = useState(false);
	const [output, setOutput] = useState<string>("結果がここに表示されます");

	const handleFetchUsers = useCallback(async () => {
		setLoading(true);
		setOutput("Loading...");
		try {
			const res = await listUsers();
			if (!res.ok) {
				setOutput(`Error: ${formatErrorMessage(res.error)}`);
				return;
			}
			setOutput(JSON.stringify(res.data, null, 2));
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
