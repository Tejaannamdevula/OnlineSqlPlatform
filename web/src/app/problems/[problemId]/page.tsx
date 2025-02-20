"use server";

import { appDb } from "@/db/postgres";
import { problems } from "@/db/postgres/schema";
import { sql } from "drizzle-orm";
import { ProblemPageClient } from "./ProblemPageClient";

async function fetchProblemById(problemId: string) {
	if (!problemId) return null; // id need to exist
	console.log("Fetching problem by ID:", problemId);
	const result = await appDb
		.select({
			id: problems.id,
			title: problems.title,
			description: problems.description,
			boilerplate: problems.boilerplate,
			expectedOutput: problems.output,
		})
		.from(problems)
		.where(sql`${problems.id} = ${problemId}`);

	return result[0] || null;
}

export default async function ProblemPage({
	params,
}: {
	params: { problemId: string };
}) {
	const { problemId } = params;
	const problemData = await fetchProblemById(problemId);

	if (!problemData) {
		return <div>Problem not found</div>;
	}

	return <ProblemPageClient problemData={problemData} />;
}
