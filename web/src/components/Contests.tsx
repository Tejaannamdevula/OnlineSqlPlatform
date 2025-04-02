import { getContests } from "@/app/actions/contest";
import { ContestCard } from "./ContestCard";

export async function Contests() {
	const contestsResult = await getContests();

	if (!contestsResult.success) {
		return (
			<div className="min-h-screen p-8">
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

	const allContests = contestsResult.data || [];
	const now = new Date();

	// Separate contests into upcoming, active, and past
	const upcomingContests = allContests.filter(
		(contest) => new Date(contest.startTime) > now
	);

	const activeContests = allContests.filter(
		(contest) =>
			new Date(contest.startTime) <= now && new Date(contest.endTime) >= now
	);

	const pastContests = allContests.filter(
		(contest) => new Date(contest.endTime) < now
	);

	return (
		<div className="min-h-screen">
			{activeContests.length > 0 && (
				<section className="bg-white dark:bg-gray-900 py-8 md:py-12">
					<div className="container mx-auto px-4 md:px-6">
						<div className="mb-6">
							<h2 className="text-2xl font-bold mb-2">Active Contests</h2>
							<p className="text-gray-500 dark:text-gray-400">
								These contests are currently running. Join now!
							</p>
						</div>
						<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
							{activeContests.map((contest) => (
								<ContestCard
									key={contest.id}
									title={contest.title}
									id={contest.id}
									startTime={new Date(contest.startTime)}
									endTime={new Date(contest.endTime)}
								/>
							))}
						</div>
					</div>
				</section>
			)}

			<section className="bg-white dark:bg-gray-900 py-8 md:py-12">
				<div className="container mx-auto px-4 md:px-6">
					<div className="mb-6">
						<h2 className="text-2xl font-bold mb-2">Upcoming Contests</h2>
						<p className="text-gray-500 dark:text-gray-400">
							Check out these upcoming contests.
						</p>
					</div>
					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
						{upcomingContests.length > 0 ? (
							upcomingContests.map((contest) => (
								<ContestCard
									key={contest.id}
									title={contest.title}
									id={contest.id}
									startTime={new Date(contest.startTime)}
									endTime={new Date(contest.endTime)}
								/>
							))
						) : (
							<div className="col-span-full text-center py-8 text-gray-500">
								No upcoming contests at the moment.
							</div>
						)}
					</div>
				</div>
			</section>

			<section className="bg-white dark:bg-gray-900 py-8 md:py-12">
				<div className="container mx-auto px-4 md:px-6">
					<div className="mb-6">
						<h2 className="text-2xl font-bold mb-2">Previous Contests</h2>
						<p className="text-gray-500 dark:text-gray-400">
							Browse through our past contests.
						</p>
					</div>
					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
						{pastContests.length > 0 ? (
							pastContests.map((contest) => (
								<ContestCard
									key={contest.id}
									title={contest.title}
									id={contest.id}
									startTime={new Date(contest.startTime)}
									endTime={new Date(contest.endTime)}
								/>
							))
						) : (
							<div className="col-span-full text-center py-8 text-gray-500">
								No past contests available.
							</div>
						)}
					</div>
				</div>
			</section>
		</div>
	);
}
