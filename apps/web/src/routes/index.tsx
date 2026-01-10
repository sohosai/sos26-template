import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/Button";

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

function Index() {
	return (
		<div>
			<h1>Welcome Sohosai Online System!</h1>
			<Button onClick={() => alert("clicked!")}>ボタン</Button>
		</div>
	);
}
