import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
	component: RootComponent,
	errorComponent: ErrorComponent,
	notFoundComponent: NotFoundComponent,
});

function RootComponent() {
	return (
		<>
			<HeadContent />
			<Outlet />
			{import.meta.env.DEV && <TanStackRouterDevtools />}
		</>
	);
}

function NotFoundComponent() {
	return <div>404 Not Found.</div>;
}

function ErrorComponent({ error }: { error: unknown }) {
	const message =
		error instanceof Error ? error.message : String(error ?? "Unknown error");

	return (
		<div>
			<div>Error Occered.</div>
			<div>{message}</div>
		</div>
	);
}
