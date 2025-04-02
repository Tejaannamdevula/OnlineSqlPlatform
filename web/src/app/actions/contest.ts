"use server";

import { appDb } from "@/db/postgres";
import { contests, contestProblems } from "@/db/postgres/schema";
import { eq } from "drizzle-orm";
import { verifySession } from "./session";
import bcrypt from "bcrypt";

type CreateContestInput = {
	title: string;
	description: string;
	startTime: string;
	endTime: string;
	leaderBoard: boolean;
	protectedContest: boolean;
	password?: string;
	problems: Array<{
		id: string;
		points: number;
	}>;
};
type CreateContestResult =
	| { success: true; contestId: string }
	| { success: false; error: string };

export async function createContest(
	data: CreateContestInput
): Promise<CreateContestResult> {
	try {
		const session = await verifySession();
		if (!session?.userId) {
			return {
				success: false,
				error: "You must be logged in to create a contest",
			};
		}

		// Start a transaction
		return await appDb.transaction(async (tx) => {
			let passwordHash = null;
			if (data.protectedContest && data.password) {
				passwordHash = await bcrypt.hash(data.password, 10);
			}

			// Create the contest
			const result = await tx
				.insert(contests)
				.values({
					title: data.title,
					description: data.description,
					startTime: new Date(data.startTime),
					endTime: new Date(data.endTime),
					leaderBoard: Boolean(data.leaderBoard),
					createdBy: String(session.userId),
					protectedContest: data.protectedContest,
					passwordHash: passwordHash,
				})
				.returning();

			const contestId = result[0].id;

			// Add problems to the contest
			if (data.problems.length > 0) {
				const contestProblemValues = data.problems.map((problem) => ({
					contestId,
					problemId: problem.id,
					points: problem.points,
					solved: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				}));

				await tx.insert(contestProblems).values(contestProblemValues);
			}

			return {
				success: true,
				contestId,
			};
		});
	} catch (error) {
		console.error("Error creating contest:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to create contest",
		};
	}
}

export async function getContests() {
	try {
		const allContests = await appDb
			.select()
			.from(contests)
			.orderBy(contests.createdAt);

		return {
			success: true,
			data: allContests,
		};
	} catch (error) {
		console.error("Error fetching contests:", error);
		return {
			success: false,
			error: "Failed to fetch contests",
		};
	}
}

export async function getContestById(id: string) {
	try {
		const contest = await appDb
			.select()
			.from(contests)
			.where(eq(contests.id, id))
			.limit(1);

		if (!contest.length) {
			return {
				success: false,
				error: "Contest not found",
			};
		}

		// Get problems for this contest
		const contestProblemsData = await appDb
			.select()
			.from(contestProblems)
			.where(eq(contestProblems.contestId, id));

		return {
			success: true,
			data: {
				...contest[0],
				problems: contestProblemsData,
			},
		};
	} catch (error) {
		console.error("Error fetching contest:", error);
		return {
			success: false,
			error: "Failed to fetch contest",
		};
	}
}

import { problems, problem_tags, tags } from "@/db/postgres/schema";

export type FetchProblemsParams = {
	hidden?: boolean;
	difficulty?: "easy" | "medium" | "hard";
	limit?: number;
	offset?: number;
};

export async function fetchProblems(params: FetchProblemsParams = {}) {
	try {
		let query = appDb
			.select({
				id: problems.id,
				title: problems.title,
				difficulty: problems.difficulty,
			})
			.from(problems);

		// Apply filters
		if (params.hidden !== undefined) {
			query = query.where(eq(problems.hidden, params.hidden));
		}

		if (params.difficulty) {
			query = query.where(eq(problems.difficulty, params.difficulty));
		}

		// Apply pagination
		if (params.limit) {
			query = query.limit(params.limit);
		}

		if (params.offset) {
			query = query.offset(params.offset);
		}

		const problemsData = await query;

		// Fetch tags for each problem
		const problemsWithTags = await Promise.all(
			problemsData.map(async (problem) => {
				const problemTagsData = await appDb
					.select({
						tagId: problem_tags.tagId,
						tagName: tags.name,
					})
					.from(problem_tags)
					.innerJoin(tags, eq(problem_tags.tagId, tags.id))
					.where(eq(problem_tags.problemId, problem.id));

				return {
					...problem,
					tags: problemTagsData.map((tag) => tag.tagName),
				};
			})
		);

		return {
			success: true,
			data: problemsWithTags,
		};
	} catch (error) {
		console.error("Error fetching problems:", error);
		return {
			success: false,
			error: "Failed to fetch problems",
		};
	}
}

export async function getProblemById(id: string) {
	try {
		const problem = await appDb
			.select()
			.from(problems)
			.where(eq(problems.id, id))
			.limit(1);

		if (!problem.length) {
			return {
				success: false,
				error: "Problem not found",
			};
		}

		// Fetch tags for the problem
		const problemTagsData = await appDb
			.select({
				tagId: problem_tags.tagId,
				tagName: tags.name,
			})
			.from(problem_tags)
			.innerJoin(tags, eq(problem_tags.tagId, tags.id))
			.where(eq(problem_tags.problemId, id));

		return {
			success: true,
			data: {
				...problem[0],
				tags: problemTagsData.map((tag) => tag.tagName),
			},
		};
	} catch (error) {
		console.error("Error fetching problem:", error);
		return {
			success: false,
			error: "Failed to fetch problem",
		};
	}
}
