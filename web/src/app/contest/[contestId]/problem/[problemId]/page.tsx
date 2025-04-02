import { fetchProblemById } from "@/app/problems/[problemId]/page";
import { verifySession } from "@/app/actions/session";
import { getContestWithProblems } from "@/app/actions/contest-actions";
import { ContestProblemClient } from "./ContestProblemClient";
import { redirect } from "next/navigation";

export default async function ContestProblemPage({
	params,
}: {
	params: { contestId: string; problemId: string };
}) {
	const { contestId, problemId } = params;

	// Verify user session
	const session = await verifySession();
	if (!session.isAuth) {
		redirect(
			"/api/login?callbackUrl=" +
				encodeURIComponent(`/contest/${contestId}/problem/${problemId}`)
		);
	}

	// Fetch problem data
	const problemData = await fetchProblemById(problemId);

	// Fetch contest data to verify the problem belongs to this contest
	const contestResult = await getContestWithProblems(contestId);

	if (!problemData) {
		return <div className="p-8 text-center">Problem not found</div>;
	}

	if (!contestResult.success) {
		return (
			<div className="p-8 text-center">
				{contestResult.error || "Contest not found"}
			</div>
		);
	}

	const contest = contestResult.data;

	// Check if problem belongs to this contest
	const problemInContest = contest.problems.some(
		(p) => p.problem.id === problemId
	);

	if (!problemInContest) {
		return (
			<div className="p-8 text-center">
				This problem is not part of the current contest
			</div>
		);
	}

	// Check if contest is active
	const now = new Date();
	const isActive =
		now >= new Date(contest.startTime) && now <= new Date(contest.endTime);

	if (!isActive) {
		return (
			<div className="p-8 text-center">
				{now < new Date(contest.startTime)
					? "This contest has not started yet"
					: "This contest has ended"}
			</div>
		);
	}

	// Prepare contest info for the client component
	const contestInfo = {
		id: contest.id,
		name: contest.name,
		endTime: contest.endTime,
	};

	return (
		<ContestProblemClient
			problemData={problemData}
			contestId={contestId}
			contestInfo={contestInfo}
			isAuthenticated={session.isAuth}
		/>
	);
}
