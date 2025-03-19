import { appDb } from "@/db/postgres";
import { verifySession } from "@/app/actions/session";

export async function checkAdminAccess() {
	const session = await verifySession();

	if (!session?.isAuth || !session?.userId) {
		return false;
	}

	if (session.role === "admin") {
		return true;
	}
}
