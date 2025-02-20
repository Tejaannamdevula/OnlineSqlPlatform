"use client";

import { useEffect, useState } from "react";

export default function UserDashboard() {
	const [user, setUser] = useState<{ name: string } | null>(null);

	useEffect(() => {
		const fetchSession = async () => {
			try {
				const res = await fetch("/api/session");
				if (!res.ok) throw new Error("Failed to fetch session");

				const session = await res.json();
				if (session?.isAuth && session.email) {
					setUser({ name: session.email.split("@")[0] });
				}
			} catch (error) {
				console.error(error);
			}
		};

		fetchSession();
	}, []);

	return (
		<div className="flex h-screen w-screen justify-center items-center text-2xl font-semibold">
			{user ? `Welcome, ${user.name}!` : "Loading..."}
		</div>
	);
}
