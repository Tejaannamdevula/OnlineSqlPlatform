import type { Metadata } from "next";
import { CreateContestForm } from "@/components/admin/create-contest-form";
import { checkAdminAccess } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
	title: "Create Contest | SQL Learning Platform",
	description: "Create a new contest for users to participate in",
};

export default async function CreateContestPage() {
	const isAdmin = await checkAdminAccess();

	if (!isAdmin) {
		redirect("/unauthorized");
	}

	return (
		<div className="container mx-auto py-8">
			<h1 className="text-3xl font-bold mb-8">Create New Contest</h1>
			<CreateContestForm />
		</div>
	);
}
