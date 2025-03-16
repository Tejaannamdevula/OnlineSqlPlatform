// "use server";

// import { db } from "@/db";
// import { Parser } from "node-sql-parser";

// export type QueryExecutionResult = {
// 	success: boolean;
// 	data?: Array<{
// 		type: string;
// 		data?: Array<Record<string, string | number>>;
// 		message?: string;
// 	}>;
// 	error?: string;
// };

// export async function executeUserQuery(
// 	query: string
// ): Promise<QueryExecutionResult> {
// 	console.log("Executing query:", query);
// 	try {
// 		const parser = new Parser();
// 		console.log("Query is ", query);

// 		// Parse the SQL to get AST (Abstract Syntax Tree)
// 		const ast = parser.astify(query);

// 		// If single query, convert to array
// 		const queries = Array.isArray(ast) ? ast : [ast];

// 		const results = [];

// 		for (const queryAst of queries) {
// 			// Convert AST back to SQL to get clean, validated query
// 			const cleanQuery = parser.sqlify(queryAst);

// 			const [rows, fields] = await db.execute(cleanQuery);

// 			// Check query type from AST
// 			const isSelect = queryAst.type === "select";

// 			if (isSelect) {
// 				if (Array.isArray(rows) && rows.length > 0) {
// 					results.push({
// 						type: "result",
// 						data: rows.map((row) => {
// 							const plainRow: Record<string, string | number> = {};
// 							for (const [key, value] of Object.entries(row)) {
// 								if (typeof value === "string" || typeof value === "number") {
// 									plainRow[key] = value;
// 								}
// 							}
// 							return plainRow;
// 						}),
// 					});
// 				} else {
// 					results.push({
// 						type: "message",
// 						message: "Query executed successfully - No data returned",
// 					});
// 				}
// 			} else {
// 				results.push({
// 					type: "message",
// 					message: `Query executed successfully - ${
// 						rows.affectedRows || 0
// 					} row(s) affected`,
// 				});
// 			}
// 		}

// 		return {
// 			success: true,
// 			data: results,
// 		};
// 	} catch (error) {
// 		console.error("Query Execution Error:", error);
// 		return {
// 			success: false,
// 			error: error instanceof Error ? error.message : "Unknown error",
// 		};
// 	}
// }
"use server";

import { db } from "@/db";
import { Parser } from "node-sql-parser";

export type QueryExecutionResult = {
	success: boolean;
	data?: Array<{
		type: string;
		data?: Array<Record<string, string | number>>;
		message?: string;
	}>;
	error?: string;
};

export async function executeUserQuery(
	query: string
): Promise<QueryExecutionResult> {
	console.log("Executing query:", query);
	try {
		const parser = new Parser();
		console.log("Query is ", query);

		// Parse the SQL to get AST (Abstract Syntax Tree)
		const ast = parser.astify(query);

		// If single query, convert to array
		const queries = Array.isArray(ast) ? ast : [ast];

		const results = [];

		for (const queryAst of queries) {
			// Convert AST back to SQL to get clean, validated query
			const cleanQuery = parser.sqlify(queryAst);

			const [rows, fields] = await db.execute(cleanQuery);

			// Check query type from AST
			const isSelect = queryAst.type === "select";

			if (isSelect) {
				if (Array.isArray(rows) && rows.length > 0) {
					results.push({
						type: "result",
						data: rows.map((row) => {
							const plainRow: Record<string, string | number> = {};
							for (const [key, value] of Object.entries(row)) {
								if (typeof value === "string" || typeof value === "number") {
									plainRow[key] = value;
								}
							}
							return plainRow;
						}),
					});
				} else {
					results.push({
						type: "message",
						message: "Query executed successfully - No data returned",
					});
				}
			} else {
				results.push({
					type: "message",
					message: `Query executed successfully - ${
						rows.affectedRows || 0
					} row(s) affected`,
				});
			}
		}

		return {
			success: true,
			data: results,
		};
	} catch (error) {
		console.error("Query Execution Error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

// // This would be a separate action to submit the solution
// export async function submitSolution(
// 	problemId: string,
// 	userId: string,
// 	code: string
// ): Promise<{
// 	success: boolean;
// 	submissionId?: string;
// 	status?: "AC" | "Rejected" | "Pending";
// 	error?: string;
// }> {
// 	try {
// 		// In a real implementation, you would:
// 		// 1. Save the submission to the database
// 		// 2. Run all test cases (including hidden ones)
// 		// 3. Update the submission status
// 		// 4. Return the results

// 		// For now, we'll return a mock result
// 		return {
// 			success: true,
// 			submissionId: "mock-submission-id",
// 			status: "AC",
// 		};
// 	} catch (error) {
// 		console.error("Error submitting solution:", error);
// 		return {
// 			success: false,
// 			error: error instanceof Error ? error.message : "Unknown error occurred",
// 		};
// 	}
// }
import { appDb } from "@/db/postgres";
import { verifySession } from "./session";
import {
	submissions,
	problem_test_cases,
	submission_test_results,
	problems,
} from "@/db/postgres/schema";
import { eq, sql } from "drizzle-orm";
// export async function submitSolution({
// 	code,
// 	problemId,
// }: {
// 	code: string;
// 	problemId: string;
// }): Promise<{
// 	success: boolean;
// 	message: string;
// 	passedTests: number;
// 	totalTests: number;
// }> {
// 	try {
// 		// Use the existing verifySession function
// 		const session = await verifySession();

// 		if (!session.isAuth) {
// 			return {
// 				success: false,
// 				message: "You must be logged in to submit solutions",
// 				passedTests: 0,
// 				totalTests: 0,
// 			};
// 		}
// 		console.log("Session is ", session);
// 		const userId = session.userId;

// 		if (!userId) {
// 			return {
// 				success: false,
// 				message: "User ID not found in session",
// 				passedTests: 0,
// 				totalTests: 0,
// 			};
// 		}

// 		// Start a transaction
// 		return await appDb.transaction(async (tx) => {
// 			// 1. Fetch test cases first to validate if the problem exists
// 			const testCases = await tx
// 				.select()
// 				.from(problem_test_cases)
// 				.where(eq(problem_test_cases.problemId, problemId));

// 			if (testCases.length === 0) {
// 				throw new Error("No test cases found for this problem");
// 			}

// 			const totalTests = testCases.length;

// 			// 2. Create a new submission record
// 			const [submissionResult] = await tx
// 				.insert(submissions)
// 				.values({
// 					userId,
// 					problemId,
// 					code,
// 					status: "Pending",
// 				})
// 				.returning({ id: submissions.id });

// 			const submissionId = submissionResult.id;

// 			let passedTests = 0;

// 			// 3. Run each test case and record results
// 			for (const testCase of testCases) {
// 				try {
// 					// Combine input data and user code
// 					const combinedSQL = `${testCase.inputData}\n${code}`;

// 					// Execute the query
// 					const result = await executeUserQuery(combinedSQL);

// 					// Compare with expected output
// 					let passed = result.success;
// 					if (passed && testCase.expectedOutput && result.data) {
// 						try {
// 							const expectedOutput = JSON.parse(testCase.expectedOutput);
// 							passed =
// 								JSON.stringify(expectedOutput.data) ===
// 								JSON.stringify(result.data[0]?.data);
// 						} catch (e) {
// 							console.error("Error comparing outputs:", e);
// 							passed = false;
// 						}
// 					}

// 					// Record the test case result
// 					await tx.insert(submission_test_results).values({
// 						submissionId,
// 						testCaseId: testCase.id,
// 						actualOutput: JSON.stringify(result),
// 						result: passed ? "AC" : "Fail",
// 						executionTime: 0,
// 						memoryUsage: 0,
// 					});

// 					if (passed) passedTests++;
// 				} catch (error) {
// 					console.error("Test case execution error:", error);
// 					// Record the error as a test case failure
// 					await tx.insert(submission_test_results).values({
// 						submissionId,
// 						testCaseId: testCase.id,
// 						actualOutput: JSON.stringify({
// 							error: error instanceof Error ? error.message : "Unknown error",
// 						}),
// 						result: "CompilationError",
// 						executionTime: 0,
// 						memoryUsage: 0,
// 					});
// 				}
// 			}

// 			// 4. Update the submission status based on test results
// 			const finalStatus = passedTests === totalTests ? "AC" : "Rejected";
// 			await tx
// 				.update(submissions)
// 				.set({ status: finalStatus })
// 				.where(eq(submissions.id, submissionId));

// 			// 5. Return the results
// 			return {
// 				success: passedTests === totalTests,
// 				message:
// 					passedTests === totalTests
// 						? "All tests passed successfully!"
// 						: `${passedTests} out of ${totalTests} tests passed.`,
// 				passedTests,
// 				totalTests,
// 			};
// 		});
// 	} catch (error) {
// 		console.error("Error submitting solution:", error);
// 		return {
// 			success: false,
// 			message:
// 				error instanceof Error ? error.message : "Unknown error occurred",
// 			passedTests: 0,
// 			totalTests: 0,
// 		};
// 	}
// }
export async function submitSolution({
	code,
	problemId,
}: {
	code: string;
	problemId: string;
}): Promise<{
	success: boolean;
	message: string;
	passedTests: number;
	totalTests: number;
}> {
	try {
		// Use the existing verifySession function
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

		if (!userId) {
			return {
				success: false,
				message: "User ID not found in session",
				passedTests: 0,
				totalTests: 0,
			};
		}

		// Start a transaction
		return await appDb.transaction(async (tx) => {
			// 1. Fetch the problem to get the boilerplate code
			const problemResult = await tx
				.select({
					boilerplate: problems.sqlBoilerplate,
				})
				.from(problems)
				.where(eq(problems.id, problemId));

			if (problemResult.length === 0) {
				throw new Error("Problem not found");
			}

			const boilerplate = problemResult[0].boilerplate;

			// 2. Fetch all test cases for this problem
			const testCases = await tx
				.select()
				.from(problem_test_cases)
				.where(eq(problem_test_cases.problemId, problemId));

			if (testCases.length === 0) {
				throw new Error("No test cases found for this problem");
			}

			const totalTests = testCases.length;

			// 3. Create a new submission record
			const [submissionResult] = await tx
				.insert(submissions)
				.values({
					userId,
					problemId,
					code,
					status: "Pending",
				})
				.returning({ id: submissions.id });

			const submissionId = submissionResult.id;

			let passedTests = 0;

			// 4. Run each test case and record results
			for (const testCase of testCases) {
				try {
					// Combine code components in the same way as handleRunCode:
					// - First add the boilerplate
					// - Then add the test case input data
					// - Finally add the user's code
					const combinedSQL = `${boilerplate}\n${testCase.inputData}\n${code}`;

					// Execute the query
					const result = await executeUserQuery(combinedSQL);

					// Compare with expected output
					let passed = result.success;
					if (passed && testCase.expectedOutput && result.data) {
						try {
							const expectedOutput = JSON.parse(testCase.expectedOutput);
							// Check if the actual output matches the expected output
							passed =
								JSON.stringify(expectedOutput.data) ===
								JSON.stringify(result.data[0]?.data);
						} catch (e) {
							console.error("Error comparing outputs:", e);
							passed = false;
						}
					}

					// Record the test case result
					await tx.insert(submission_test_results).values({
						submissionId,
						testCaseId: testCase.id,
						actualOutput: JSON.stringify(result),
						result: passed ? "AC" : "Fail",
						executionTime: 0,
						memoryUsage: 0,
					});

					if (passed) passedTests++;
				} catch (error) {
					console.error("Test case execution error:", error);
					// Record the error as a test case failure
					await tx.insert(submission_test_results).values({
						submissionId,
						testCaseId: testCase.id,
						actualOutput: JSON.stringify({
							error: error instanceof Error ? error.message : "Unknown error",
						}),
						result: "CompilationError",
						executionTime: 0,
						memoryUsage: 0,
					});
				}
			}

			// 5. Update the submission status based on test results
			const finalStatus = passedTests === totalTests ? "AC" : "Rejected";
			await tx
				.update(submissions)
				.set({ status: finalStatus })
				.where(eq(submissions.id, submissionId));

			// 6. Return the results
			return {
				success: passedTests === totalTests,
				message:
					passedTests === totalTests
						? "All tests passed successfully!"
						: `${passedTests} out of ${totalTests} tests passed.`,
				passedTests,
				totalTests,
			};
		});
	} catch (error) {
		console.error("Error submitting solution:", error);
		return {
			success: false,
			message:
				error instanceof Error ? error.message : "Unknown error occurred",
			passedTests: 0,
			totalTests: 0,
		};
	}
}
