"use server";

import { appDb } from "@/db/postgres";
import {
	problems,
	tags,
	problem_tags,
	problem_test_cases,
} from "@/db/postgres/schema";
import { executeUserQuery } from "./playGroundAction";
import { eq } from "drizzle-orm";
import test from "node:test";

type TestCase = {
	inputData: string;
	isHidden: boolean;
};

type ProblemInput = {
	title: string;
	description: string;
	sqlBoilerplate: string;
	sqlSolution: string;
	difficulty?: "easy" | "medium" | "hard";
	hidden?: boolean;
	tags?: string[];
	testCases?: TestCase[];
};

export async function saveProblem(data: ProblemInput) {
	try {
		// Validate required fields
		if (
			!data.title ||
			!data.description ||
			!data.sqlBoilerplate ||
			!data.sqlSolution
		) {
			return {
				success: false,
				error: "Missing required fields",
			};
		}

		// Save problem to database
		const [problem] = await appDb
			.insert(problems)
			.values({
				title: data.title,
				description: data.description,
				sqlBoilerplate: data.sqlBoilerplate,
				sqlSolution: data.sqlSolution,
				difficulty: data.difficulty || "medium",
				hidden: data.hidden || false,
			})
			.returning({ id: problems.id });

		// Handle tags
		if (data.tags && data.tags.length > 0) {
			for (const tagName of data.tags) {
				// Check if tag exists
				const existingTags = await appDb
					.select()
					.from(tags)
					.where(eq(tags.name, tagName));
				let tagId;

				if (existingTags.length === 0) {
					// Create new tag
					const [newTag] = await appDb
						.insert(tags)
						.values({
							name: tagName,
						})
						.returning({ id: tags.id });
					tagId = newTag.id;
				} else {
					tagId = existingTags[0].id;
				}

				// Create problem-tag relationship
				await appDb.insert(problem_tags).values({
					problemId: problem.id,
					tagId: tagId,
				});
			}
		}

		// Handle test cases
		if (data.testCases && data.testCases.length > 0) {
			for (const testCase of data.testCases) {
				// Skip empty test cases
				if (!testCase.inputData.trim()) {
					continue;
				}

				// Generate the expected output automatically
				// First execute the boilerplate code
				console.log("execution of boilerplate code");
				const setupResult = await executeUserQuery(data.sqlBoilerplate);
				if (!setupResult.success) {
					return {
						success: false,
						error: `Failed to execute boilerplate SQL: ${setupResult.error}`,
					};
				}

				// Then execute the test case input data
				console.log("execution of test case input", { testCase });
				const inputResult = await executeUserQuery(testCase.inputData);
				if (!inputResult.success) {
					return {
						success: false,
						error: `Failed to execute test case input: ${inputResult.error}`,
					};
				}

				// Finally execute the solution query to get the expected output
				console.log("execution of solution query");
				const solutionResult = await executeUserQuery(data.sqlSolution);
				if (!solutionResult.success) {
					return {
						success: false,
						error: `Failed to execute solution SQL: ${solutionResult.error}`,
					};
				}

				// Convert the solution result data to JSON string
				const expectedOutput = JSON.stringify(solutionResult.data || []);

				// Save the test case with the automatically generated expected output
				await appDb.insert(problem_test_cases).values({
					problemId: problem.id,
					inputData: testCase.inputData,
					expectedOutput,
					isHidden: testCase.isHidden,
				});
			}
		}

		return { success: true };
	} catch (error) {
		console.error("Error saving problem:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to save problem",
		};
	}
}
