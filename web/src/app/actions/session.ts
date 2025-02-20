import "server-only";

import type { SessionPayload } from "@/lib/types/session.types.";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const secretKey = process.env.SESSION_SECRET;
if (!secretKey) {
	throw new Error("SESSION_SECRET environment variable is not set");
}
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: SessionPayload) {
	return new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("7d")
		.sign(key);
}

export async function decrypt(session: string | undefined = "") {
	if (!session) {
		return null;
	}
	try {
		const { payload } = await jwtVerify(session, key, {
			algorithms: ["HS256"],
		});
		return payload as SessionPayload;
	} catch (error) {
		console.error("Failed to verify session:", error);
		return null;
	}
}

export async function createSession(data: SessionPayload) {
	try {
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
		const { userId, email, role } = data;

		if (!userId || !email || !role) {
			throw new Error("Missing required session data");
		}

		const session = await encrypt({ userId, email, role, expiresAt });
		const cookieStore = await cookies();

		cookieStore.set("session", session, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			expires: expiresAt,
			sameSite: "lax",
			path: "/",
		});
	} catch (error) {
		console.error("Failed to create session:", error);
		redirect("/api/login");
	}
}
export async function verifySession() {
	try {
		const cookieStore = await cookies();
		const cookie = cookieStore.get("session")?.value;
		const session = await decrypt(cookie);

		if (!session?.userId) {
			return { isAuth: false, role: null };
		}

		return {
			isAuth: true,
			userId: Number(session.userId),
			role: session.role,
			email: session.email,
		};
	} catch (error) {
		console.error("Session verification failed:", error);
		return { isAuth: false, role: null };
	}
}

export async function updateSession() {
	try {
		const cookieStore = await cookies();
		const session = cookieStore.get("session")?.value;
		const payload = await decrypt(session);

		if (!session || !payload) {
			return null;
		}

		// Keep consistent with createSession expiration time
		const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

		// Create new session with updated expiration
		const newSession = await encrypt({
			...payload,
			expiresAt: expires,
		});

		cookieStore.set("session", newSession, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			expires: expires,
			sameSite: "lax",
			path: "/",
		});

		return payload;
	} catch (error) {
		console.error("Failed to update session:", error);
		return null;
	}
}
