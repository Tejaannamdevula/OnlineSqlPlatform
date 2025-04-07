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
import {
	CalendarIcon,
	TrophyIcon,
	ClockIcon,
	ListOrderedIcon,
	ArrowRightIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

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
			<div className="flex flex-col min-h-screen p-6 max-w-screen-lg mx-auto">
				<div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center my-8">
					<h2 className="text-2xl font-semibold text-red-700 mb-3">
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
		<div className="flex flex-col min-h-screen p-6 max-w-screen-lg mx-auto">
			<div className="mb-8">
				<h1 className="text-3xl sm:text-4xl font-bold mb-3">
					Contest Standings
				</h1>
				<p className="text-muted-foreground">
					View and track performance across all coding competitions
				</p>
			</div>

			<div>
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
		<div className="space-y-8">
			{activeContests.length > 0 && (
				<Card>
					<CardHeader className="pb-3 border-b bg-green-50 dark:bg-green-900/20">
						<CardTitle className="text-lg text-green-700 dark:text-green-400 flex items-center">
							<TrophyIcon className="mr-2 h-5 w-5" />
							Active Contests
						</CardTitle>
						<CardDescription className="text-green-600/70 dark:text-green-500/70">
							Competitions currently in progress
						</CardDescription>
					</CardHeader>
					<CardContent className="p-0">
						<ContestsList contests={activeContests} />
					</CardContent>
				</Card>
			)}

			{upcomingContests.length > 0 && (
				<Card>
					<CardHeader className="pb-3 border-b bg-blue-50 dark:bg-blue-900/20">
						<CardTitle className="text-lg text-blue-700 dark:text-blue-400 flex items-center">
							<CalendarIcon className="mr-2 h-5 w-5" />
							Upcoming Contests
						</CardTitle>
						<CardDescription className="text-blue-600/70 dark:text-blue-500/70">
							Scheduled competitions starting soon
						</CardDescription>
					</CardHeader>
					<CardContent className="p-0">
						<ContestsList contests={upcomingContests} />
					</CardContent>
				</Card>
			)}

			{finishedContests.length > 0 && (
				<Card>
					<CardHeader className="pb-3 border-b bg-gray-50 dark:bg-gray-700/30">
						<CardTitle className="text-lg text-gray-700 dark:text-gray-300 flex items-center">
							<ListOrderedIcon className="mr-2 h-5 w-5" />
							Finished Contests
						</CardTitle>
						<CardDescription className="text-gray-600/70 dark:text-gray-400/70">
							Past competitions with final results
						</CardDescription>
					</CardHeader>
					<CardContent className="p-0">
						<ContestsList contests={finishedContests} />
					</CardContent>
				</Card>
			)}

			{contests.length === 0 && (
				<div className="py-12 text-center rounded-lg border-2 border-dashed">
					<TrophyIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
					<h3 className="text-lg font-medium text-muted-foreground mb-2">
						No contests available
					</h3>
					<p className="text-sm text-muted-foreground/70">
						There are no contests with leaderboards at the moment
					</p>
				</div>
			)}
		</div>
	);
}

function ContestsList({ contests }: { contests: IContest[] }) {
	// Format date strings for display
	const dateTimeOptions: Intl.DateTimeFormatOptions = {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	};

	const formatDateTime = (date: Date) =>
		date.toLocaleString(undefined, dateTimeOptions);

	return (
		<div className="overflow-hidden">
			<Table>
				<TableHeader>
					<TableRow className="bg-muted/50 hover:bg-muted/50">
						<TableHead className="w-[40%]">Contest Name</TableHead>
						<TableHead className="hidden md:table-cell">
							<div className="flex items-center">
								<ClockIcon className="mr-2 h-4 w-4 text-muted-foreground" />
								Timeline
							</div>
						</TableHead>
						<TableHead className="hidden sm:table-cell w-[120px]">
							Status
						</TableHead>
						<TableHead className="text-right" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{contests.map((contest) => (
						<TableRow key={contest.id} className="group">
							<TableCell className="font-medium">
								<div>{contest.title}</div>
								<div className="block sm:hidden text-xs text-muted-foreground mt-1">
									<StatusBadge status={contest.status} />
								</div>
								<div className="md:hidden text-xs text-muted-foreground mt-1">
									{formatDateTime(new Date(contest.startTime))} -{" "}
									{formatDateTime(new Date(contest.endTime))}
								</div>
							</TableCell>
							<TableCell className="hidden md:table-cell">
								<div className="flex items-center">
									<span>{formatDateTime(new Date(contest.startTime))}</span>
									<ArrowRightIcon className="mx-2 h-3.5 w-3.5 text-muted-foreground" />
									<span>{formatDateTime(new Date(contest.endTime))}</span>
								</div>
							</TableCell>
							<TableCell className="hidden sm:table-cell">
								<StatusBadge status={contest.status} />
							</TableCell>
							<TableCell className="text-right">
								<PrimaryButton
									href={`/admin/standings/${contest.id}`}
									size="sm"
									className="transition-all group-hover:bg-primary/90"
								>
									<span>View</span>
									<ArrowRightIcon className="ml-2 h-4 w-4" />
								</PrimaryButton>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

function StatusBadge({
	status,
}: {
	status: "upcoming" | "active" | "finished";
}) {
	if (status === "active") {
		return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
	}

	if (status === "upcoming") {
		return <Badge className="bg-blue-500 hover:bg-blue-600">Upcoming</Badge>;
	}

	return <Badge variant="outline">Finished</Badge>;
}
