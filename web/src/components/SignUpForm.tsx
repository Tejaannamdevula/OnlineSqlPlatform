"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import { ActionResponse } from "@/lib/types/signup.types";

import { signup } from "@/app/actions/auth";
const initialState: ActionResponse = {
	success: false,
	message: "",
};

export default function SignUpForm() {
	const [state, action, isPending] = useActionState(signup, initialState);

	return (
		<Card className="w-full max-w-lg mx-auto">
			<CardHeader>
				<CardTitle>User Registration</CardTitle>
				<CardDescription>
					Please enter your information to sign up.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form action={action} className="space-y-6" autoComplete="on">
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Full Name</Label>
							<Input
								id="name"
								name="name"
								placeholder="John Doe"
								// required
								minLength={3}
								maxLength={100}
								autoComplete="name"
								aria-describedby="name-error"
								className={state?.errors?.name ? "border-red-500" : ""}
							/>
							{state?.errors?.name && (
								<p id="name-error" className="text-sm text-red-500">
									{state.errors.name[0]}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								placeholder="abc@email.com"
								required
								maxLength={255}
								autoComplete="email"
								aria-describedby="email-error"
								className={state?.errors?.email ? "border-red-500" : ""}
							/>
							{state?.errors?.email && (
								<p id="email-error" className="text-sm text-red-500">
									{state.errors.email[0]}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								name="password"
								type="password"
								placeholder="********"
								required
								minLength={6}
								autoComplete="new-password"
								aria-describedby="password-error"
								className={state?.errors?.password ? "border-red-500" : ""}
							/>
							{state?.errors?.password && (
								<p id="password-error" className="text-sm text-red-500">
									{state.errors.password[0]}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="role">Role</Label>
							<select
								id="role"
								name="role"
								defaultValue="user"
								className="w-full border p-2 rounded-md"
							>
								<option value="user">User</option>
								<option value="admin">Admin</option>
							</select>
						</div>
					</div>

					{state?.message && (
						<Alert variant={state.success ? "default" : "destructive"}>
							{state.success && <CheckCircle2 className="h-4 w-4" />}
							<AlertDescription>{state.message}</AlertDescription>
						</Alert>
					)}

					<Button type="submit" className="w-full" disabled={isPending}>
						{isPending ? "Registering..." : "Register"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
