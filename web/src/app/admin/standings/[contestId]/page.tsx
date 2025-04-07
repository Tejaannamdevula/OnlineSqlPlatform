import { getContestById } from "@/app/actions/contest";
import { getContestStandings } from "@/app/actions/standingAction";
import { ContestPointsTable } from "@/components/ContestPointsTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { verifySession } from "@/app/actions/session";
import Link from "next/link";
import { ArrowLeft, Calendar, Users, Trophy } from "lucide-react";

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

	if (!contestResult.success || !contestResult.data) {
		return (
			<div className="flex flex-col min-h-screen p-6 max-w-screen-lg mx-auto">
				<div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center my-8">
					<h2 className="text-2xl font-semibold text-red-700 mb-3">Error</h2>
					<p className="text-red-600 mb-6">
						{!contestResult.success ? contestResult.error : "Contest not found"}
					</p>
					<Link href="/admin/standings" className="inline-block">
						<Button variant="outline" size="lg">
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
			<div className="flex flex-col min-h-screen p-6 max-w-screen-lg mx-auto">
				<div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center my-8">
					<h2 className="text-2xl font-semibold text-red-700 mb-3">Error</h2>
					<p className="text-red-600 mb-6">
						{!standingsResult.success
							? standingsResult.error
							: "Failed to load standings"}
					</p>
					<Link href="/admin/standings" className="inline-block">
						<Button variant="outline" size="lg">
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
	let statusBgClass = "bg-gray-100";

	if (isUpcoming) {
		statusText = "Upcoming";
		statusClass = "text-blue-700";
		statusBgClass = "bg-blue-50";
	} else if (isActive) {
		statusText = "Active";
		statusClass = "text-green-700";
		statusBgClass = "bg-green-50";
	} else if (isFinished) {
		statusText = "Finished";
		statusClass = "text-red-700";
		statusBgClass = "bg-red-50";
	}

	// Format date and time for display
	const formatFullDate = (date: Date) => {
		return date.toLocaleDateString("en-US", {
			weekday: "short",
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	// Check if dates are on same day
	const sameDay = startDate.toDateString() === endDate.toDateString();

	let dateTimeDisplay: string;
	if (sameDay) {
		// Same day format: "Mon, Jan 1, 2025, 10:00 AM - 6:00 PM"
		dateTimeDisplay = `${startDate.toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
			year: "numeric",
		})}, ${startDate.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
		})} - ${endDate.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
		})}`;
	} else {
		// Different days format: "Mon, Jan 1, 2025, 10:00 AM - Tue, Jan 2, 2025, 6:00 PM"
		dateTimeDisplay = `${formatFullDate(startDate)} - ${formatFullDate(
			endDate
		)}`;
	}

	return (
		<div className="flex flex-col min-h-screen p-6 max-w-screen-lg mx-auto">
			<Link
				href="/admin/standings"
				className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-8 transition-colors"
			>
				<ArrowLeft className="mr-2 h-4 w-4" />
				Back to All Standings
			</Link>

			{/* Contest Header - Simplified and cleaner */}
			<div className="mb-10">
				<div className="flex flex-wrap items-start justify-between gap-4 mb-4">
					<h1 className="text-3xl sm:text-4xl font-bold">{contest.title}</h1>
					<div
						className={`${statusBgClass} px-4 py-2 rounded-full text-sm font-medium ${statusClass}`}
					>
						{statusText}
					</div>
				</div>

				{contest.description && (
					<p className="text-muted-foreground text-lg mb-6 max-w-3xl">
						{contest.description}
					</p>
				)}

				<div className="flex flex-col sm:flex-row gap-6 text-sm text-muted-foreground">
					<div className="flex items-center">
						<Calendar className="mr-2 h-5 w-5 text-primary" />
						<span>{dateTimeDisplay}</span>
					</div>
					<div className="flex items-center">
						<Users className="mr-2 h-5 w-5 text-primary" />
						<span>{standings.length} participants</span>
					</div>
				</div>
			</div>

			{/* Leaderboard - Cleaner with more spacing */}
			<Card className="shadow-sm border-0 overflow-hidden">
				<CardHeader className="pb-3 border-b bg-muted/30">
					<CardTitle className="text-xl flex items-center">
						<Trophy className="mr-2 h-5 w-5 text-primary" />
						Leaderboard
					</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					<ContestPointsTable
						contestPoints={standings}
						currentUser={
							session.isAuth
								? {
										id: session.userId as string,
										name: session.user?.name || "",
								  }
								: undefined
						}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
