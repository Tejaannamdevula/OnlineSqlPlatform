"use server";

import { appDb } from "@/db/postgres";
import { users } from "../../db/postgres/schema";
import { ActionResponse, signUpFormData } from "@/lib/types/signup.types";
import { eq } from "drizzle-orm";
import { createSession } from "./session";
import { signUpFormSchema, loginFormSchema } from "@/lib/definitions";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function signup(
	prevState: ActionResponse | null,
	formData: FormData
): Promise<ActionResponse> {
	// Simulate network delay
	await new Promise((resolve) => setTimeout(resolve, 1000));

	const rawData: signUpFormData = {
		name: formData.get("name") as string,
		email: formData.get("email") as string,
		password: formData.get("password") as string,
		role: formData.get("role") as "user" | "admin",
	};

	// 1. Validate schema
	const validatedData = signUpFormSchema.safeParse(rawData);

	if (!validatedData.success) {
		return {
			success: false,
			message: "Invalid form data.",
			errors: validatedData.error.flatten().fieldErrors,
		};
	}
	//2.insertion
	// Here you would typically insert the user data into your database
	// console.log("User registered:", validatedData.data);
	const { name, email, password, role } = validatedData.data;

	const existingUser = await appDb.query.users.findFirst({
		where: eq(users.email, email),
	});

	if (existingUser) {
		return {
			success: false,
			message: "Email already exist ,use a different email or login",
		};
	}

	const hashedPassword = await bcrypt.hash(password, 10);

	const data = await appDb
		.insert(users)
		.values({
			name,
			email,
			password: hashedPassword,
			role,
		})
		.returning({ id: users.id, role: users.role });

	const user = data[0];

	if (!user) {
		return {
			success: false,
			message: "Error occured ",
		};
	}

	return {
		success: true,
		message: "Registration successful! login",
	};
}

export async function login(
	prevState: ActionResponse | null,
	formData: FormData
): Promise<ActionResponse> {
	// Simulate network delay
	await new Promise((resolve) => setTimeout(resolve, 1000));

	// 1. Validate form fields
	const validatedFields = loginFormSchema.safeParse({
		email: formData.get("email"),
		password: formData.get("password"),
	});

	if (!validatedFields.success) {
		return {
			success: false,
			message: "Data is not valid",
			errors: validatedFields.error.flatten().fieldErrors,
		};
	}

	const { email, password } = validatedFields.data;

	const user = await appDb.query.users.findFirst({
		where: eq(users.email, email),
	});

	if (!user) {
		return {
			success: false,
			message: "User not found. Please check your credentials.",
		};
	}

	// Compare the hashed password with the provided password
	const isPasswordValid = await bcrypt.compare(password, user.password);

	if (!isPasswordValid) {
		return {
			success: false,
			message: "Invalid password. Please try again.",
		};
	}

	// Create a session or token for the authenticated user (for example, using a session cookie)
	await createSession({ userId: user.id, role: user.role, email: user.email });
	if (user.role === "admin") {
		return redirect("/admin");
	} else {
		return redirect("/problems");
	}
}

export async function logout() {
	const cookieStore = await cookies();
	cookieStore.delete("session");
	redirect("/api/login");
}
