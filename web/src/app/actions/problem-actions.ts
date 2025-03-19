"use server";

import { appDb } from "@/db/postgres";
import { problems, tags, problem_tags, difficulty } from "@/db/postgres/schema";
import { sql, eq, like, inArray } from "drizzle-orm";

export async function getProblems({
	search = "",
	page = 1,
	limit = 10,
	tags: tagIds = [],
	difficulties = [],
}: {
	search?: string;
	page?: number;
	limit?: number;
	tags?: string[];
	difficulties?: string[];
}) {
	try {
		const offset = (page - 1) * limit;

		// Build the base query
		const baseQuery = appDb
			.select({
				id: problems.id,
				title: problems.title,
				difficulty: problems.difficulty,
			})
			.from(problems);

		// Apply filters using separate queries instead of modifying the original
		let filteredQuery = baseQuery;

		// Apply search filter
		if (search) {
			filteredQuery = appDb
				.select({
					id: problems.id,
					title: problems.title,
					difficulty: problems.difficulty,
				})
				.from(problems)
				.where(like(problems.title, `%${search}%`));
		}

		// Apply difficulty filter - with type safety
		if (difficulties.length > 0) {
			// Validate difficulties to ensure they match enum values
			const validDifficulties = difficulties.filter((d) =>
				["easy", "medium", "hard"].includes(d)
			) as Array<(typeof difficulty.enumValues)[number]>;

			filteredQuery = appDb
				.select({
					id: problems.id,
					title: problems.title,
					difficulty: problems.difficulty,
				})
				.from(problems)
				.where(search ? like(problems.title, `%${search}%`) : undefined)
				.where(
					validDifficulties.length > 0
						? inArray(problems.difficulty, validDifficulties)
						: undefined
				);
		}

		// Apply tag filter if provided
		if (tagIds.length > 0) {
			// Validate difficulties here too if they're used in this query
			const validDifficulties = difficulties.filter((d) =>
				["easy", "medium", "hard"].includes(d)
			) as Array<(typeof difficulty.enumValues)[number]>;

			filteredQuery = appDb
				.select({
					id: problems.id,
					title: problems.title,
					difficulty: problems.difficulty,
				})
				.from(problems)
				.innerJoin(problem_tags, eq(problems.id, problem_tags.problemId))
				.where(search ? like(problems.title, `%${search}%`) : undefined)
				.where(
					validDifficulties.length > 0
						? inArray(problems.difficulty, validDifficulties)
						: undefined
				)
				.where(inArray(problem_tags.tagId, tagIds));
		}

		// Get problems with pagination
		const problemsData = await filteredQuery
			.orderBy(problems.createdAt)
			.limit(limit)
			.offset(offset);

		// Get total count for pagination
		let countQuery = appDb
			.select({ count: sql<number>`count(*)` })
			.from(problems);

		// Apply the same filters to count query
		if (search) {
			countQuery = appDb
				.select({ count: sql<number>`count(*)` })
				.from(problems)
				.where(like(problems.title, `%${search}%`));
		}

		if (difficulties.length > 0) {
			// Validate difficulties for count query
			const validDifficulties = difficulties.filter((d) =>
				["easy", "medium", "hard"].includes(d)
			) as Array<(typeof difficulty.enumValues)[number]>;

			countQuery = appDb
				.select({ count: sql<number>`count(*)` })
				.from(problems)
				.where(search ? like(problems.title, `%${search}%`) : undefined)
				.where(
					validDifficulties.length > 0
						? inArray(problems.difficulty, validDifficulties)
						: undefined
				);
		}

		if (tagIds.length > 0) {
			// Validate difficulties for this count query too
			const validDifficulties = difficulties.filter((d) =>
				["easy", "medium", "hard"].includes(d)
			) as Array<(typeof difficulty.enumValues)[number]>;

			countQuery = appDb
				.select({ count: sql<number>`count(*)` })
				.from(problems)
				.innerJoin(problem_tags, eq(problems.id, problem_tags.problemId))
				.where(search ? like(problems.title, `%${search}%`) : undefined)
				.where(
					validDifficulties.length > 0
						? inArray(problems.difficulty, validDifficulties)
						: undefined
				)
				.where(inArray(problem_tags.tagId, tagIds));
		}

		const [countResult] = await countQuery;
		const totalCount = countResult?.count || 0;
		const totalPages = Math.ceil(totalCount / limit);

		// Get tags for each problem
		const problemIds = problemsData.map((p) => p.id);
		const problemTagsData = await appDb
			.select({
				problemId: problem_tags.problemId,
				tagId: tags.id,
				tagName: tags.name,
			})
			.from(problem_tags)
			.innerJoin(tags, eq(problem_tags.tagId, tags.id))
			.where(inArray(problem_tags.problemId, problemIds));

		// Get all available tags for filter
		const availableTags = await appDb
			.select({
				id: tags.id,
				name: tags.name,
			})
			.from(tags)
			.orderBy(tags.name);

		// Map tags to problems
		const problemsWithTags = problemsData.map((problem) => ({
			...problem,
			tags: problemTagsData
				.filter((pt) => pt.problemId === problem.id)
				.map((pt) => ({ id: pt.tagId, name: pt.tagName })),
		}));

		return {
			problems: problemsWithTags,
			totalPages,
			currentPage: page,
			totalCount,
			availableTags,
		};
	} catch (error) {
		console.error("Error fetching problems:", error);
		throw error;
	}
}

export async function getProblemById(problemId: string) {
	try {
		const [problem] = await appDb
			.select()
			.from(problems)
			.where(eq(problems.id, problemId));

		if (!problem) {
			return { success: false, error: "Problem not found" };
		}

		// Get problem tags
		const problemTags = await appDb
			.select({
				id: tags.id,
				name: tags.name,
			})
			.from(tags)
			.innerJoin(problem_tags, eq(tags.id, problem_tags.tagId))
			.where(eq(problem_tags.problemId, problemId));

		return {
			success: true,
			problem: {
				...problem,
				tags: problemTags,
			},
		};
	} catch (error) {
		console.error("Error fetching problem:", error);
		return { success: false, error: "Failed to fetch problem details" };
	}
}

export async function getAvailableTags() {
	try {
		const tagsData = await appDb
			.select({
				id: tags.id,
				name: tags.name,
			})
			.from(tags)
			.orderBy(tags.name);

		return { success: true, tags: tagsData };
	} catch (error) {
		console.error("Error fetching tags:", error);
		return { success: false, error: "Failed to fetch tags" };
	}
}
