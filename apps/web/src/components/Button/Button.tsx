import type { ReactNode } from "react";
import styles from "./Button.module.scss";

type ButtonProps = {
	children: ReactNode;
	onClick?: () => void;
};

export function Button({ children, onClick }: ButtonProps) {
	return (
		<button type="button" className={styles.button} onClick={onClick}>
			{children}
		</button>
	);
}
