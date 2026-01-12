import type { MouseEventHandler, ReactNode } from "react";
import styles from "./Button.module.scss";

type ButtonProps = {
	children: ReactNode;
	onClick?: MouseEventHandler<HTMLButtonElement>;
	disabled?: boolean;
};

export function Button({ children, onClick, disabled }: ButtonProps) {
	return (
		<button
			type="button"
			className={styles.button}
			onClick={onClick}
			disabled={disabled}
		>
			{children}
		</button>
	);
}
