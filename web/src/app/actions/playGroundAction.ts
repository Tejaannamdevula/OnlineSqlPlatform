"use server";

import { db } from "@/db";
import { Parser } from "node-sql-parser";
import { appDb } from "@/db/postgres";
import { verifySession } from "./session";
import {
	submissions,
	problem_test_cases,
	submission_test_results,
	problems,
} from "@/db/postgres/schema";
import { eq, sql, and } from "drizzle-orm";

export type QueryExecutionResult = {
	success: boolean;
	data?: Array<{
		type: string;
		data?: Array<Record<string, string | number>>;
		message?: string;
	}>;
	error?: string;
};
//without error handling
// export async function executeUserQuery(
// 	query: string
// ): Promise<QueryExecutionResult> {
// 	console.log("Executing query:", query);
// 	try {
// 		const parser = new Parser();
// 		// console.log("Query is ", query);

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

export async function executeUserQuery(
	query: string
): Promise<QueryExecutionResult> {
	console.log("Executing query:", query);
	try {
		const parser = new Parser();

		// Parse the SQL to get AST (Abstract Syntax Tree)
		let ast;
		try {
			ast = parser.astify(query);
		} catch (parseError) {
			// Improve syntax error parsing
			let meaningfulError = "Invalid SQL syntax";

			if (parseError instanceof Error) {
				const errorMessage = parseError.message.toLowerCase();

				// Create more user-friendly error messages
				const errorMappings = [
					{
						pattern: /unexpected token/i,
						message:
							"Unexpected token in your SQL query. Please check your syntax carefully.",
					},
					{
						pattern: /syntax error/i,
						message:
							"There's a syntax error in your SQL statement. Verify your query structure.",
					},
					{
						pattern: /near/i,
						message: "SQL syntax error near a specific part of your query.",
					},
				];

				// Find a matching error mapping
				const matchedError = errorMappings.find((mapping) =>
					mapping.pattern.test(errorMessage)
				);

				if (matchedError) {
					meaningfulError = matchedError.message;
				}

				// If possible, extract the specific problematic part
				const extractLocationMatch = errorMessage.match(/near "?([^"]*)"?/i);
				if (extractLocationMatch) {
					meaningfulError += ` Problematic area: "${extractLocationMatch[1]}"`;
				}
			}

			return {
				success: false,
				error: meaningfulError,
			};
		}

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

		// Provide a more meaningful error message
		let errorMessage =
			"An unexpected error occurred while executing the query.";

		if (error instanceof Error) {
			// Check for common database-related errors
			const errorString = error.message.toLowerCase();

			const errorMappings = [
				{
					pattern: /syntax error/i,
					message:
						"There's a syntax error in your SQL statement. Please review your query carefully.",
				},
				{
					pattern: /unknown column/i,
					message:
						"One or more columns in your query do not exist in the table.",
				},
				{
					pattern: /table .* doesn't exist/i,
					message: "The table you're trying to query does not exist.",
				},
				{
					pattern: /access denied/i,
					message:
						"You do not have permission to perform this database operation.",
				},
			];

			// Find a matching error mapping
			const matchedError = errorMappings.find((mapping) =>
				mapping.pattern.test(errorString)
			);

			if (matchedError) {
				errorMessage = matchedError.message;
			} else {
				// Use the original error message if no specific mapping is found
				errorMessage = error.message;
			}
		}

		return {
			success: false,
			error: errorMessage,
		};
	}
}
export const clearAllTableData = async () => {
	try {
		// Disable foreign key checks
		await db.execute("SET FOREIGN_KEY_CHECKS = 0");

		// Get all table names in the current database
		const [tables]: any = await db.execute(
			`SELECT table_name 
			 FROM information_schema.tables 
			 WHERE table_schema = DATABASE() 
			 `
		);

		// Debugging output
		console.log("Tables fetched:", tables);

		// Ensure tables exist before truncating
		if (!tables || tables.length === 0) {
			console.log("No tables found to truncate.");
		} else {
			for (const table of tables) {
				if (table?.TABLE_NAME) {
					await db.execute(`TRUNCATE TABLE \`${table?.TABLE_NAME}\``);
				} else {
					console.warn("Skipping undefined table entry:", table);
				}
			}
		}

		// Re-enable foreign key checks
		await db.execute("SET FOREIGN_KEY_CHECKS = 1");

		console.log("All table data cleared successfully");
	} catch (error) {
		console.error("Error clearing table data:", error);

		// Ensure foreign key checks are re-enabled even if an error occurs
		await db.execute("SET FOREIGN_KEY_CHECKS = 1");

		throw error;
	}
};

export const deleteAllTables = async () => {
	try {
		// Disable foreign key checks
		await db.execute("SET FOREIGN_KEY_CHECKS = 0");

		// Get all table names in the current database
		const [tables]: any = await db.execute(
			`SELECT table_name 
			 FROM information_schema.tables 
			 WHERE table_schema = DATABASE() 
			 `
		);

		// Debugging output
		console.log("Tables fetched for deletion:", tables);

		// Ensure tables exist before dropping
		if (!tables || tables.length === 0) {
			console.log("No tables found to delete.");
		} else {
			for (const table of tables) {
				if (table?.TABLE_NAME) {
					await db.execute(`DROP TABLE IF EXISTS \`${table.TABLE_NAME}\``);
				} else {
					console.warn("Skipping undefined table entry:", table);
				}
			}
		}

		// Re-enable foreign key checks
		await db.execute("SET FOREIGN_KEY_CHECKS = 1");

		console.log("All tables deleted successfully");
	} catch (error) {
		console.error("Error deleting tables:", error);

		// Ensure foreign key checks are re-enabled even if an error occurs
		await db.execute("SET FOREIGN_KEY_CHECKS = 1");

		throw error;
	}
};

export async function runCode({
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
	results: Array<{ testCaseId: string; passed: boolean; actualOutput: any }>;
}> {
	try {
		// Fetch problem details
		const problemResult = await appDb
			.select({ boilerplate: problems.sqlBoilerplate })
			.from(problems)
			.where(eq(problems.id, problemId));

		if (problemResult.length === 0) {
			throw new Error("Problem not found");
		}

		const boilerplate = problemResult[0].boilerplate;

		// Fetch test cases for the problem
		const testCases = await appDb
			.select()
			.from(problem_test_cases)
			.where(
				and(
					eq(problem_test_cases.problemId, problemId),
					eq(problem_test_cases.isHidden, false)
				)
			);

		if (testCases.length === 0) {
			throw new Error("No test cases found for this problem");
		}

		const totalTests = testCases.length;
		let passedTests = 0;
		const testResults = [];

		// Execute the boilerplate setup
		const boilerplateResult = await executeUserQuery(boilerplate);

		// Check if boilerplate execution was successful
		if (!boilerplateResult.success) {
			throw new Error(`Boilerplate setup failed: ${boilerplateResult.error}`);
		}

		for (const testCase of testCases) {
			try {
				await clearAllTableData(); // Clear all table data before running the test case

				// Combine test case input with user query
				const combinedSQL = `${testCase.inputData}\n${code}`;

				// Execute the query
				const result = await executeUserQuery(combinedSQL);

				// If query execution failed, return the error message directly
				if (!result.success) {
					throw new Error(result.error || "Query execution failed");
				}

				let passed = result.success;

				// Compare output with expected output
				if (passed && testCase.expectedOutput && result.data) {
					try {
						const expectedOutput = JSON.parse(testCase.expectedOutput);

						const actualOutput = result.data
							.filter((entry) => entry.type === "result")
							.map((entry) => entry.data);

						const expectedData = expectedOutput
							.filter((entry) => entry.type === "result")
							.map((entry) => entry.data);

						passed =
							JSON.stringify(expectedData) === JSON.stringify(actualOutput);
					} catch (e) {
						console.error("Error comparing outputs:", e);
						passed = false;
					}
				}

				testResults.push({
					testCaseId: testCase.id,
					passed,
					actualOutput: result.data,
				});

				if (passed) passedTests++;
			} catch (error) {
				console.error("Test case execution error:", error);
				testResults.push({
					testCaseId: testCase.id,
					passed: false,
					actualOutput: {
						error: error instanceof Error ? error.message : "Unknown error",
					},
				});
			}
		}

		await deleteAllTables(); // Clean up after execution

		return {
			success: passedTests === totalTests,
			message:
				passedTests === totalTests
					? "All test cases passed!"
					: `${passedTests} out of ${totalTests} test cases passed.`,
			passedTests,
			totalTests,
			results: testResults,
		};
	} catch (error) {
		console.error("Error running code:", error);
		return {
			success: false,
			message:
				error instanceof Error ? error.message : "Unknown error occurred",
			passedTests: 0,
			totalTests: 0,
			results: [],
		};
	}
}

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
			// execute boilerplate
			await executeUserQuery(boilerplate);
			// 4. Run each test case and record results

			let count = 1;
			console.log("executing test casessssssssssssssss ");
			for (const testCase of testCases) {
				try {
					console.log("Executing test case count:", count);

					await clearAllTableData(); // Clearing all tables data

					// Combine boilerplate, test case input, and user code
					const combinedSQL = `${testCase.inputData}\n${code}`;

					// Execute the query
					const result = await executeUserQuery(combinedSQL);
					console.log("Execution Result:", result);
					console.log("Expected Output:", testCase.expectedOutput);

					let passed = result.success;

					if (passed && testCase.expectedOutput && result.data) {
						try {
							const expectedOutput = JSON.parse(testCase.expectedOutput);

							// Extract only rows from the result, ignoring messages
							const actualOutput = result.data
								.filter((entry) => entry.type === "result")
								.map((entry) => entry.data); // Extract only the data

							const expectedData = expectedOutput
								.filter((entry) => entry.type === "result")
								.map((entry) => entry.data);

							// Ensure both have the same structure before comparing
							passed =
								JSON.stringify(expectedData) === JSON.stringify(actualOutput);
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
				count += 1;
			}

			// 5. Update the submission status based on test results
			const finalStatus = passedTests === totalTests ? "AC" : "Rejected";
			await tx
				.update(submissions)
				.set({ status: finalStatus })
				.where(eq(submissions.id, submissionId));

			await deleteAllTables(); // deleting all created tables
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
