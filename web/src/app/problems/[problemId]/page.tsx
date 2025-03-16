import { appDb } from "@/db/postgres";
import { problems, problem_test_cases } from "@/db/postgres/schema";
import { sql } from "drizzle-orm";
// import ProblemPageClient from "./ProblemPageClient";
import { verifySession } from "@/app/actions/session";
import { ProblemPageClient } from "./ProblemPageClient";
async function fetchProblemById(problemId: string) {
	if (!problemId) return null; // id need to exist
	console.log("Fetching problem by ID:", problemId);

	const result = await appDb
		.select({
			id: problems.id,
			title: problems.title,
			description: problems.description,
			boilerplate: problems.sqlBoilerplate,
			solution: problems.sqlSolution,
			difficulty: problems.difficulty,
		})
		.from(problems)
		.where(sql`${problems.id} = ${problemId}`);

	if (!result[0]) return null;

	// Fetch test cases for this problem
	const testCases = await appDb
		.select({
			id: problem_test_cases.id,
			inputData: problem_test_cases.inputData,
			expectedOutput: problem_test_cases.expectedOutput,
			isHidden: problem_test_cases.isHidden,
		})
		.from(problem_test_cases)
		.where(sql`${problem_test_cases.problemId} = ${problemId}`);

	return {
		...result[0],
		testCases,
	};
}

export default async function ProblemPage({
	params,
}: {
	params: { problemId: string };
}) {
	const { problemId } = await params;
	const problemData = await fetchProblemById(problemId);

	// Check if user is authenticated using your session system
	const session = await verifySession();
	const isAuthenticated = session.isAuth;

	if (!problemData) {
		return <div>Problem not found</div>;
	}

	return (
		<ProblemPageClient
			problemData={problemData}
			isAuthenticated={isAuthenticated}
		/>
	);
}
