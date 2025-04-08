"use client";
import { useState } from "react";
import type React from "react";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { verifyContestPassword } from "@/app/actions/contest-actions";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Lock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function AccessForm({ contestId }: { contestId: string }) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const returnUrl = searchParams.get("returnUrl") || `/contest/${contestId}`;
	const { toast } = useToast();
	const [password, setPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!password.trim()) {
			setError("Please enter the contest password");
			return;
		}

		setIsSubmitting(true);

		try {
			const result = await verifyContestPassword(contestId, password);

			if (result.success) {
				// Access granted, redirect to contest page
				toast({
					title: "Access granted",
					description: "You now have access to the contest",
					variant: "default",
					className: "bg-green-500 text-white",
				});

				// Short delay to show the success message
				setTimeout(() => {
					router.push(returnUrl);
				}, 1000);
			} else {
				// Access denied
				setError(result.error || "Invalid password");
			}
		} catch (error) {
			setError("An unexpected error occurred");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="container mx-auto flex items-center justify-center min-h-screen p-4">
			<Card className="w-full max-w-md shadow-lg">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl font-bold text-center">
						Protected Contest
					</CardTitle>
					<CardDescription className="text-center">
						This contest requires a password to access
					</CardDescription>
				</CardHeader>
				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-center mb-6">
							<div className="bg-primary/10 p-3 rounded-full">
								<Lock className="h-6 w-6 text-primary" />
							</div>
						</div>

						{error && (
							<Alert variant="destructive" className="mb-4">
								<AlertCircle className="h-4 w-4" />
								<AlertTitle>Error</AlertTitle>
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<div className="space-y-2">
							<Input
								id="password"
								type="password"
								placeholder="Enter contest password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="w-full"
							/>
						</div>
					</CardContent>
					<CardFooter>
						<Button type="submit" className="w-full" disabled={isSubmitting}>
							{isSubmitting ? "Verifying..." : "Access Contest"}
						</Button>
					</CardFooter>
				</form>
			</Card>
			<Toaster />
		</div>
	);
}
