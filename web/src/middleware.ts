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

	// Define common routes that both admin and regular users can access
	const commonRoutePrefixes = ["/contest"];
	const isCommonRoute = commonRoutePrefixes.some((prefix) =>
		path.startsWith(prefix)
	);

	// If the user isn't authenticated, redirect to the login page
	if (isProtectedRoute && !session?.userId) {
		return NextResponse.redirect(new URL("/api/login", req.nextUrl));
	}

	// Enforce role-specific routes:
	// If an authenticated admin is accessing a non-admin and non-common route, redirect them to admin.
	if (
		session?.userId &&
		session?.role === "admin" &&
		!isAdminRoute &&
		!isCommonRoute
	) {
		return NextResponse.redirect(new URL("/admin", req.nextUrl));
	}

	// Uncommenting below if you want to enforce user role restrictions similarly
	// if (session?.userId && session?.role === "user" && !isUserRoute && !isCommonRoute) {
	// 	return NextResponse.redirect(new URL("/user", req.nextUrl));
	// }

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
