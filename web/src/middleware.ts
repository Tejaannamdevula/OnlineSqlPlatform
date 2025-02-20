import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/app/actions/session";
import { cookies } from "next/headers";

export default async function middleware(req: NextRequest) {
	console.log("Middleware running");
	const path = req.nextUrl.pathname;
	const cookieValue = (await cookies()).get("session")?.value;
	const session = await decrypt(cookieValue);

	// Check if the route is protected by verifying if it starts with "/admin" or "/user"
	const isAdminRoute = path.startsWith("/admin");
	const isUserRoute = path.startsWith("/user");
	const isProtectedRoute = isAdminRoute || isUserRoute;

	// If the user isn't authenticated, redirect to the login page
	if (isProtectedRoute && !session?.userId) {
		return NextResponse.redirect(new URL("/api/login", req.nextUrl));
	}

	// Enforce role-specific routes:
	// If an authenticated admin is not accessing an admin route, redirect them.
	if (session?.userId && session?.role === "admin" && !isAdminRoute) {
		return NextResponse.redirect(new URL("/admin", req.nextUrl));
	}

	// // If an authenticated user (non-admin) is not accessing a user route, redirect them.
	// if (session?.userId && session?.role === "user" && !isUserRoute) {
	// 	return NextResponse.redirect(new URL("/user", req.nextUrl));
	// }

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
