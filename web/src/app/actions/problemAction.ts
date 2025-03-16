"use server";

import { appDb, pool } from "@/db/postgres";
import {
	problem_test_cases,
	submissions,
	submission_test_results,
	userProblems,
} from "@/db/postgres/schema";
import { sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { verifySession } from "./session";

// Function to execute a single test case
export async function executeUserQuery({
	code,
	testCaseId,
	problemId,
	customTestCase,
}: {
	code: string;
	testCaseId?: string;
	problemId: string;
	customTestCase?: { inputData: string; expectedOutput: string };
}) {
	try {
		// Fetch the test case if not a custom test case
		let testCase;
		if (!customTestCase) {
			testCase = await appDb
				.select({
					id: problem_test_cases.id,
					inputData: problem_test_cases.inputData,
					expectedOutput: problem_test_cases.expectedOutput,
				})
				.from(problem_test_cases)
				.where(sql`${problem_test_cases.id} = ${testCaseId}`);

			if (!testCase[0]) {
				return {
					success: false,
					error: "Test case not found",
				};
			}
		}

		// Use custom test case if provided
		const inputData = customTestCase
			? JSON.parse(customTestCase.inputData)
			: JSON.parse(testCase[0].inputData);
		const expectedOutput = customTestCase
			? JSON.parse(customTestCase.expectedOutput)
			: JSON.parse(testCase[0].expectedOutput);

		// Create a temporary client for this execution
		const client = await pool.connect();

		try {
			// Start a transaction
			await client.query("BEGIN");

			// Set up the database state based on inputData
			for (const setup of inputData.setup || []) {
				await client.query(setup);
			}

			// Execute the user's SQL code
			const startTime = performance.now();
			const result = await client.query(code);
			const endTime = performance.now();
			const executionTime = endTime - startTime;

			// Compare the result with expected output
			const resultData = {
				type: "result",
				data: result.rows,
			};

			const isCorrect =
				JSON.stringify(resultData.data) === JSON.stringify(expectedOutput.data);

			// Rollback transaction to clean up
			await client.query("ROLLBACK");

			return {
				success: isCorrect,
				data: [resultData],
				executionTime,
			};
		} finally {
			// Release the client back to the pool
			client.release();
		}
	} catch (error) {
		console.error("Error executing query:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "An unknown error occurred",
		};
	}
}

// Function to submit a solution (runs against all test cases + user test case)
export async function submitSolution({
	code,
	problemId,
	customTestCase,
}: {
	code: string;
	problemId: string;
	customTestCase?: { inputData: string; expectedOutput: string };
}) {
	const session = await verifySession();

	if (!session.isAuth) {
		return {
			success: false,
			message: "You must be logged in to submit solutions",
			passedTests: 0,
			totalTests: 0,
		};
	}

	const userId = session.userId;

	try {
		// Fetch all test cases for this problem
		const testCases = await appDb
			.select({
				id: problem_test_cases.id,
				inputData: problem_test_cases.inputData,
				expectedOutput: problem_test_cases.expectedOutput,
				isHidden: problem_test_cases.isHidden,
			})
			.from(problem_test_cases)
			.where(sql`${problem_test_cases.problemId} = ${problemId}`);

		if (testCases.length === 0) {
			return {
				success: false,
				message: "No test cases found for this problem",
				passedTests: 0,
				totalTests: 0,
			};
		}

		const submissionId = uuidv4();
		await appDb.insert(submissions).values({
			id: submissionId,
			userId: userId.toString(),
			problemId,
			code,
			status: "Pending",
		});

		let passedTests = 0;
		const totalTests = testCases.length + (customTestCase ? 1 : 0);
		const testResults = [];

		for (const testCase of testCases) {
			const result = await executeUserQuery({
				code,
				testCaseId: testCase.id,
				problemId,
			});

			if (result.success) passedTests++;
			testResults.push({ testCaseId: testCase.id, success: result.success });
		}

		// Run user-provided test case if available
		if (customTestCase) {
			const userTestResult = await executeUserQuery({
				code,
				problemId,
				customTestCase,
			});

			if (userTestResult.success) passedTests++;
			testResults.push({ testCaseId: "user", success: userTestResult.success });
		}

		const allPassed = passedTests === totalTests;
		await appDb
			.update(submissions)
			.set({ status: allPassed ? "AC" : "Rejected" })
			.where(sql`${submissions.id} = ${submissionId}`);

		return {
			success: allPassed,
			message: allPassed ? "All test cases passed." : "Some test cases failed.",
			passedTests,
			totalTests,
			testResults,
		};
	} catch (error) {
		console.error("Error submitting solution:", error);
		return {
			success: false,
			message: "An error occurred.",
			passedTests: 0,
			totalTests: 0,
		};
	}
}
