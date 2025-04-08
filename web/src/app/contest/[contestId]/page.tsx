// import {
// 	getContestWithProblems,
// 	getContestLeaderboard,
// } from "@/app/actions/contest-actions";
// import { verifySession } from "@/app/actions/session";
// import { ContestProblemsTable } from "@/components/ContestProblemsTable";
// import { ContestPointsTable } from "@/components/ContestPointsTable";
// import { ContestClock } from "@/components/ContestClock";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { redirect } from "next/navigation";

// export default async function ContestPage({
// 	params,
// }: {
// 	params: { contestId: string };
// }) {
// 	const { contestId } = params;

// 	// Verify user session
// 	const session = await verifySession();
// 	if (!session.isAuth) {
// 		redirect(
// 			"/api/login?callbackUrl=" + encodeURIComponent(`/contest/${contestId}`)
// 		);
// 	}

// 	// Get the current user from the session
// 	const currentUser = session.userId;

// 	// Fetch contest data
// 	const contestResult = await getContestWithProblems(contestId);

// 	if (!contestResult.success) {
// 		return (
// 			<div className="p-8 text-center">
// 				<h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
// 				<p>{contestResult.error || "Failed to load contest"}</p>
// 			</div>
// 		);
// 	}

// 	const contest = contestResult.data;

// 	// Check if contest has a leaderboard and fetch it if enabled
// 	let leaderboardData = null;
// 	if (contest.leaderBoard) {
// 		const leaderboardResult = await getContestLeaderboard(contestId);
// 		if (leaderboardResult.success) {
// 			leaderboardData = leaderboardResult.data;
// 		}
// 	}

// 	// Determine contest status
// 	const now = new Date();
// 	const isUpcoming = now < new Date(contest.startTime);
// 	const isActive =
// 		now >= new Date(contest.startTime) && now <= new Date(contest.endTime);
// 	const isFinished = now > new Date(contest.endTime);

// 	let statusText = "Unknown";
// 	let statusClass = "text-gray-500";

// 	if (isUpcoming) {
// 		statusText = "Upcoming";
// 		statusClass = "text-blue-500";
// 	} else if (isActive) {
// 		statusText = "Active";
// 		statusClass = "text-green-500";
// 	} else if (isFinished) {
// 		statusText = "Finished";
// 		statusClass = "text-red-500";
// 	}

// 	return (
// 		<div className="container mx-auto px-4 py-8">
// 			<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
// 				<div>
// 					<h1 className="text-3xl font-bold mb-2">{contest.title}</h1>
// 					<p className="text-gray-600 mb-2">{contest.description}</p>
// 					<div className="flex items-center gap-4">
// 						<span className={`font-medium ${statusClass}`}>{statusText}</span>
// 						<span className="text-gray-500">
// 							{new Date(contest.startTime).toLocaleString()} -{" "}
// 							{new Date(contest.endTime).toLocaleString()}
// 						</span>
// 					</div>
// 				</div>

// 				{isActive && (
// 					<div className="mt-4 md:mt-0">
// 						<div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
// 							<div className="text-sm text-gray-500 mb-1">Time Remaining:</div>
// 							<ContestClock endTime={new Date(contest.endTime)} />
// 						</div>
// 					</div>
// 				)}
// 			</div>

// 			<Tabs defaultValue="problems" className="w-full">
// 				<TabsList className="mb-6">
// 					<TabsTrigger value="problems">Problems</TabsTrigger>
// 					{contest.leaderBoard && (
// 						<TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
// 					)}
// 				</TabsList>

// 				<TabsContent value="problems">
// 					{isUpcoming ? (
// 						<div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
// 							<h2 className="text-xl font-semibold text-blue-700 mb-2">
// 								Contest hasn't started yet
// 							</h2>
// 							<p className="text-blue-600">
// 								Problems will be available when the contest starts at{" "}
// 								{new Date(contest.startTime).toLocaleString()}
// 							</p>
// 						</div>
// 					) : (
// 						<ContestProblemsTable contest={contest} />
// 					)}
// 				</TabsContent>

// 				{contest.leaderBoard && (
// 					<TabsContent value="leaderboard">
// 						{leaderboardData ? (
// 							<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
// 								<h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
// 								<ContestPointsTable
// 									contestPoints={leaderboardData}
// 									currentUser={currentUser}
// 								/>
// 							</div>
// 						) : (
// 							<div className="text-center py-8 text-gray-500">
// 								No leaderboard data available
// 							</div>
// 						)}
// 					</TabsContent>
// 				)}
// 			</Tabs>
// 		</div>
// 	);
// }
import {
	getContestWithProblems,
	getContestLeaderboard,
	checkContestAccess,
} from "@/app/actions/contest-actions";
import { verifySession } from "@/app/actions/session";
import { ContestProblemsTable } from "@/components/ContestProblemsTable";
import { ContestPointsTable } from "@/components/ContestPointsTable";
import { ContestClock } from "@/components/ContestClock";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { redirect } from "next/navigation";

export default async function ContestPage({
	params,
}: {
	params: { contestId: string };
}) {
	const { contestId } = params;

	// Verify user session
	const session = await verifySession();
	if (!session.isAuth) {
		redirect(
			"/api/login?callbackUrl=" + encodeURIComponent(`/contest/${contestId}`)
		);
	}

	// Check if user has access to this contest
	const accessCheck = await checkContestAccess(contestId);

	// If contest requires password and user doesn't have access, redirect to access page
	if (!accessCheck.success && accessCheck.requiresPassword) {
		redirect(`/contest/${contestId}/access`);
	}

	// Fetch contest data
	const contestResult = await getContestWithProblems(contestId);

	if (!contestResult.success) {
		return (
			<div className="p-8 text-center">
				<h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
				<p>{contestResult.error || "Failed to load contest"}</p>
			</div>
		);
	}

	const contest = contestResult.data;

	// Check if contest has a leaderboard and fetch it if enabled
	let leaderboardData = null;
	if (contest.leaderBoard) {
		const leaderboardResult = await getContestLeaderboard(contestId);
		if (leaderboardResult.success) {
			leaderboardData = leaderboardResult.data;
		}
	}

	// Determine contest status
	const now = new Date();
	const isUpcoming = now < new Date(contest.startTime);
	const isActive =
		now >= new Date(contest.startTime) && now <= new Date(contest.endTime);
	const isFinished = now > new Date(contest.endTime);

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
		<div className="container mx-auto px-4 py-8">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
				<div>
					<h1 className="text-3xl font-bold mb-2">{contest.title}</h1>
					<p className="text-gray-600 mb-2">{contest.description}</p>
					<div className="flex items-center gap-4">
						<span className={`font-medium ${statusClass}`}>{statusText}</span>
						<span className="text-gray-500">
							{new Date(contest.startTime).toLocaleString()} -{" "}
							{new Date(contest.endTime).toLocaleString()}
						</span>
					</div>
				</div>

				{isActive && (
					<div className="mt-4 md:mt-0">
						<div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
							<div className="text-sm text-gray-500 mb-1">Time Remaining:</div>
							<ContestClock endTime={new Date(contest.endTime)} />
						</div>
					</div>
				)}
			</div>

			<Tabs defaultValue="problems" className="w-full">
				<TabsList className="mb-6">
					<TabsTrigger value="problems">Problems</TabsTrigger>
					{contest.leaderBoard && (
						<TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
					)}
				</TabsList>

				<TabsContent value="problems">
					{isUpcoming ? (
						<div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
							<h2 className="text-xl font-semibold text-blue-700 mb-2">
								Contest hasn't started yet
							</h2>
							<p className="text-blue-600">
								Problems will be available when the contest starts at{" "}
								{new Date(contest.startTime).toLocaleString()}
							</p>
						</div>
					) : (
						<ContestProblemsTable contest={contest} />
					)}
				</TabsContent>

				{contest.leaderBoard && (
					<TabsContent value="leaderboard">
						{leaderboardData ? (
							<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
								<h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
								<ContestPointsTable contestPoints={leaderboardData} />
							</div>
						) : (
							<div className="text-center py-8 text-gray-500">
								No leaderboard data available
							</div>
						)}
					</TabsContent>
				)}
			</Tabs>
		</div>
	);
}
