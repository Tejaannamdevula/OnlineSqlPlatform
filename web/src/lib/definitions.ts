import { z } from "zod";
export const signUpFormSchema = z.object({
	name: z.string().min(1, "Full name is required").max(255, "Name is too long"),
	email: z
		.string()
		.min(1, "Email is required")
		.email("Invalid email format")
		.max(255, "Email is too long"),
	password: z
		.string()
		.min(6, "Password must be at least 6 characters")
		.max(128, "Password is too long"),
	role: z.enum(["user", "admin"]),
});
export const loginFormSchema = z.object({
	email: z
		.string()
		.min(1, "Email is required")
		.email("Invalid email format")
		.max(255, "Email is too long"),
	password: z
		.string()
		.min(6, "Password must be at least 6 characters")
		.max(128, "Password is too long"),
});
