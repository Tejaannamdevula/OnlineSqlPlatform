import { PrimaryButton } from "@/components/LinkButton";
import { getContestsWithLeaderboard } from "@/app/actions/standingAction";
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
} from "@/components/ui/table";
import { CalendarIcon, TrophyIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface IContest {
	id: string;
	title: string;
	startTime: Date;
	endTime: Date;
	status: "upcoming" | "active" | "finished";
}

export default async function StandingsPage() {
	const contestsResult = await getContestsWithLeaderboard();

	if (!contestsResult.success) {
		return (
			<div className="flex flex-col min-h-screen p-4 max-w-screen-lg mx-auto">
				<div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
					<h2 className="text-xl font-semibold text-red-700 mb-2">
						Error Loading Contests
					</h2>
					<p className="text-red-600">
						{contestsResult.error || "Failed to load contests"}
					</p>
				</div>
			</div>
		);
	}

	// Ensure we always have an array, even if data is undefined
	const contests: IContest[] = contestsResult.data || [];

	return (
		<div className="flex flex-col min-h-screen p-4 max-w-screen-lg mx-auto">
			<div className="container px-4 md:px-6">
				<div className="mb-8">
					<h1 className="text-3xl font-bold mb-2">Contest Standings</h1>
					<p className="text-gray-500 dark:text-gray-400">
						View the leaderboards for all contests
					</p>
				</div>
			</div>
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
				<ContestsTable contests={contests} />
			</div>
		</div>
	);
}

function ContestsTable({ contests }: { contests: IContest[] }) {
	// Group contests by status
	const upcomingContests = contests.filter((c) => c.status === "upcoming");
	const activeContests = contests.filter((c) => c.status === "active");
	const finishedContests = contests.filter((c) => c.status === "finished");

	return (
		<div className="overflow-x-auto">
			{activeContests.length > 0 && (
				<>
					<div className="px-6 py-4 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800">
						<h2 className="text-lg font-semibold text-green-700 dark:text-green-400 flex items-center">
							<TrophyIcon className="mr-2 h-5 w-5" />
							Active Contests
						</h2>
					</div>
					<ContestsList contests={activeContests} />
				</>
			)}

			{upcomingContests.length > 0 && (
				<>
					<div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
						<h2 className="text-lg font-semibold text-blue-700 dark:text-blue-400 flex items-center">
							<CalendarIcon className="mr-2 h-5 w-5" />
							Upcoming Contests
						</h2>
					</div>
					<ContestsList contests={upcomingContests} />
				</>
			)}

			{finishedContests.length > 0 && (
				<>
					<div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
						<h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center">
							<TrophyIcon className="mr-2 h-5 w-5" />
							Finished Contests
						</h2>
					</div>
					<ContestsList contests={finishedContests} />
				</>
			)}

			{contests.length === 0 && (
				<div className="p-8 text-center text-gray-500">
					No contests with leaderboards available
				</div>
			)}
		</div>
	);
}

function ContestsList({ contests }: { contests: IContest[] }) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Contest Name</TableHead>
					<TableHead>Start Time</TableHead>
					<TableHead>End Time</TableHead>
					<TableHead>Status</TableHead>
					<TableHead className="text-right">Standings</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{contests.map((contest) => (
					<TableRow key={contest.id}>
						<TableCell className="font-medium">{contest.title}</TableCell>
						<TableCell>
							{new Date(contest.startTime).toLocaleString()}
						</TableCell>
						<TableCell>{new Date(contest.endTime).toLocaleString()}</TableCell>
						<TableCell>
							<StatusBadge status={contest.status} />
						</TableCell>
						<TableCell className="text-right">
							<PrimaryButton href={`/admin/standings/${contest.id}`}>
								View Standings
							</PrimaryButton>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

function StatusBadge({
	status,
}: {
	status: "upcoming" | "active" | "finished";
}) {
	if (status === "active") {
		return <Badge className="bg-green-500">Active</Badge>;
	} else if (status === "upcoming") {
		return <Badge className="bg-blue-500">Upcoming</Badge>;
	} else {
		return <Badge variant="outline">Finished</Badge>;
	}
}
