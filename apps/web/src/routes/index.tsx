import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: Index,
});

function Index() {
	return (
		<div>
			<h1>Welcome Sohosai Online System!</h1>
		</div>
	);
}
