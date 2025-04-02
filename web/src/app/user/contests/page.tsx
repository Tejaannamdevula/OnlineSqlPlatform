import Link from "next/link";

import { Contests } from "@/components/Contests";
import { JSX } from "react";
export default function Page(): JSX.Element {
	return (
		<main>
			<Contests />
		</main>
	);
}

export const dynamic = "force-dynamic";
