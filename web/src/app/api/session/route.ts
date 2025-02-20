import { NextResponse } from "next/server";
import { verifySession } from "@/app/actions/session";

export async function GET() {
	const session = await verifySession();
	return NextResponse.json(session);
}
