import { getContestById } from "@/app/actions/contest";
import { getContestStandings } from "@/app/actions/standingAction";
import { ContestPointsTable } from "@/components/ContestPointsTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { verifySession } from "@/app/actions/session";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Users } from "lucide-react";

export default async function ContestStandingsPage({
	params: { contestId },
}: {
	params: {
		contestId: string;
	};
}) {
	// Get user session
	const session = await verifySession();

	// Get contest details
	const contestResult = await getContestById(contestId);

	if (!contestResult.success) {
		return (
			<div className="flex flex-col min-h-screen p-4 max-w-screen-lg mx-auto">
				<div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
					<h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
					<p className="text-red-600">
						{contestResult.error || "Contest not found"}
					</p>
					<Link href="/admin/standings" className="mt-4 inline-block">
						<Button variant="outline">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Standings
						</Button>
					</Link>
				</div>
			</div>
		);
	}

	// Get contest standings
	const standingsResult = await getContestStandings(contestId);

	if (!standingsResult.success) {
		return (
			<div className="flex flex-col min-h-screen p-4 max-w-screen-lg mx-auto">
				<div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
					<h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
					<p className="text-red-600">
						{standingsResult.error || "Failed to load standings"}
					</p>
					<Link href="/standings" className="mt-4 inline-block">
						<Button variant="outline">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Standings
						</Button>
					</Link>
				</div>
			</div>
		);
	}

	const contest = contestResult.data;
	// Ensure we always have an array, even if data is undefined
	const standings = standingsResult.data || [];

	// Format dates
	const startDate = new Date(contest.startTime);
	const endDate = new Date(contest.endTime);
	const now = new Date();

	// Determine contest status
	const isActive = now >= startDate && now <= endDate;
	const isFinished = now > endDate;
	const isUpcoming = now < startDate;

	let statusText = "Unknown";
	let statusClass = "text-gray-500";

	if (isUpcoming) {
		statusText = "Upcoming";
		statusClass = "text-blue-500";
	} else if (isActive) {
		statusText = "Active";
		statusClass = "text-green-500";
	} else if (isFinished) {
		statusText = "Finished";
		statusClass = "text-red-500";
	}

	return (
		<div className="flex flex-col min-h-screen p-4 max-w-screen-lg mx-auto">
			<div className="mb-6">
				<Link
					href="/admin/standings"
					className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
				>
					<ArrowLeft className="mr-1 h-4 w-4" />
					Back to All Standings
				</Link>

				<h1 className="text-3xl font-bold mb-2">{contest.title} - Standings</h1>
				<div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
					<div className="flex items-center">
						<Calendar className="mr-1 h-4 w-4" />
						{startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
					</div>
					<div className="flex items-center">
						<Clock className="mr-1 h-4 w-4" />
						{startDate.toLocaleTimeString()} - {endDate.toLocaleTimeString()}
					</div>
					<div className="flex items-center">
						<span className={`font-medium ${statusClass}`}>{statusText}</span>
					</div>
				</div>
			</div>

			<div className="grid gap-6 mb-8">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-xl flex items-center">
							<Users className="mr-2 h-5 w-5" />
							Leaderboard
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ContestPointsTable
							contestPoints={standings}
							currentUser={
								session.isAuth
									? {
											id: session.userId as string,
											name: session?.name || "",
									  }
									: undefined
							}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
