import { createFileRoute } from "@tanstack/react-router";

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
		</div>
	);
}
