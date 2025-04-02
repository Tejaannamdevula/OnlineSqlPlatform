"use client";
import { useState } from "react";
import type React from "react";

import { useRouter } from "next/navigation";
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
import { checkContestAccess } from "@/app/actions/contest-actions";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Lock } from "lucide-react";

export default function ContestAccessPage({
	params,
}: {
	params: { contestId: string };
}) {
	const { contestId } = params;
	const router = useRouter();
	const { toast } = useToast();
	const [password, setPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!password.trim()) {
			toast({
				variant: "destructive",
				title: "Password Required",
				description: "Please enter the contest password",
			});
			return;
		}

		setIsSubmitting(true);

		try {
			const result = await checkContestAccess(contestId, password);

			if (result.success) {
				// Access granted, redirect to contest page
				router.push(`/contest/${contestId}`);
			} else {
				// Access denied
				toast({
					variant: "destructive",
					title: "Access Denied",
					description: result.error || "Invalid password",
				});
			}
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "An unexpected error occurred",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="container mx-auto flex items-center justify-center min-h-screen p-4">
			<Card className="w-full max-w-md">
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
						<div className="space-y-2">
							<div className="flex items-center justify-center mb-6">
								<div className="bg-blue-100 p-3 rounded-full">
									<Lock className="h-6 w-6 text-blue-600" />
								</div>
							</div>
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
