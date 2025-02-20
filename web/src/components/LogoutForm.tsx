"use server";

import { Button } from "@/components/ui/button";
import { logout } from "@/app/actions/auth";

const LogoutForm = () => {
	return (
		<form action={logout}>
			<Button type="submit" variant="destructive">
				Logout
			</Button>
		</form>
	);
};

export default LogoutForm;
