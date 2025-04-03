import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

interface PrimaryButtonProps extends ComponentProps<typeof Button> {
	href: string;
}

export function PrimaryButton({
	href,
	children,
	...props
}: PrimaryButtonProps) {
	return (
		<Link href={href}>
			<Button {...props}>{children}</Button>
		</Link>
	);
}
