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
import { ActionResponse } from "@/lib/types/login.types";

import { login } from "@/app/actions/auth";
const initialState: ActionResponse = {
	success: false,
	message: "",
};

export default function LoginForm() {
	const [state, action, isPending] = useActionState(login, initialState);

	return (
		<Card className="w-full max-w-lg mx-auto">
			<CardHeader>
				<CardTitle>User Login</CardTitle>
				<CardDescription>
					Please enter your credentials to log in.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form action={action} className="space-y-6" autoComplete="on">
					<div className="space-y-4">
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
								autoComplete="current-password"
								aria-describedby="password-error"
								className={state?.errors?.password ? "border-red-500" : ""}
							/>
							{state?.errors?.password && (
								<p id="password-error" className="text-sm text-red-500">
									{state.errors.password[0]}
								</p>
							)}
						</div>
					</div>

					{state?.message && (
						<Alert variant={state.success ? "default" : "destructive"}>
							{state.success && <CheckCircle2 className="h-4 w-4" />}
							<AlertDescription>{state.message}</AlertDescription>
						</Alert>
					)}

					<Button type="submit" className="w-full" disabled={isPending}>
						{isPending ? "Logging in..." : "Login"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
