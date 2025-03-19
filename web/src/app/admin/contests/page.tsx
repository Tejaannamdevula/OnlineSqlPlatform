import type { Metadata } from "next";
import Link from "next/link";
import { getContests } from "@/app/actions/contest-actions";
import { checkAdminAccess } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContestsList } from "@/components/admin/contests-list";

export const metadata: Metadata = {
	title: "Manage Contests | SQL Learning Platform",
	description: "Create and manage SQL contests",
};

export default async function AdminContestsPage({
	searchParams,
}: {
	searchParams: { page?: string; status?: string };
}) {
	const isAdmin = await checkAdminAccess();

	if (!isAdmin) {
		redirect("/unauthorized");
	}

	const page = searchParams.page ? Number.parseInt(searchParams.page) : 1;
	const status = searchParams.status as
		| "Upcoming"
		| "Active"
		| "Finished"
		| undefined;

	const { contests, totalPages, currentPage, totalCount } = await getContests({
		page,
		status,
	});

	// Get counts for each status
	const upcomingContests = await getContests({ status: "Upcoming", limit: 1 });
	const activeContests = await getContests({ status: "Active", limit: 1 });
	const finishedContests = await getContests({ status: "Finished", limit: 1 });

	return (
		<div className="container mx-auto py-8">
			<div className="flex justify-between items-center mb-8">
				<h1 className="text-3xl font-bold">Manage Contests</h1>
				<Link href="/admin/contests/create">
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Create Contest
					</Button>
				</Link>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-lg font-medium">Upcoming</CardTitle>
						<CardDescription>Scheduled contests</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">
							{upcomingContests.totalCount || 0}
						</div>
					</CardContent>
					<CardFooter>
						<Link
							href="/admin/contests?status=Upcoming"
							className="text-sm text-blue-600 hover:underline"
						>
							View all upcoming contests
						</Link>
					</CardFooter>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-lg font-medium">Active</CardTitle>
						<CardDescription>Currently running</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">
							{activeContests.totalCount || 0}
						</div>
					</CardContent>
					<CardFooter>
						<Link
							href="/admin/contests?status=Active"
							className="text-sm text-blue-600 hover:underline"
						>
							View all active contests
						</Link>
					</CardFooter>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-lg font-medium">Finished</CardTitle>
						<CardDescription>Completed contests</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">
							{finishedContests.totalCount || 0}
						</div>
					</CardContent>
					<CardFooter>
						<Link
							href="/admin/contests?status=Finished"
							className="text-sm text-blue-600 hover:underline"
						>
							View all finished contests
						</Link>
					</CardFooter>
				</Card>
			</div>

			<Tabs defaultValue={status || "all"} className="w-full">
				<TabsList className="mb-6">
					<TabsTrigger value="all" asChild>
						<Link href="/admin/contests">All</Link>
					</TabsTrigger>
					<TabsTrigger value="Upcoming" asChild>
						<Link href="/admin/contests?status=Upcoming">Upcoming</Link>
					</TabsTrigger>
					<TabsTrigger value="Active" asChild>
						<Link href="/admin/contests?status=Active">Active</Link>
					</TabsTrigger>
					<TabsTrigger value="Finished" asChild>
						<Link href="/admin/contests?status=Finished">Finished</Link>
					</TabsTrigger>
				</TabsList>

				<TabsContent value={status || "all"} className="mt-0">
					<ContestsList
						contests={contests}
						totalPages={totalPages}
						currentPage={currentPage}
						status={status}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
