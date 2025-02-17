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

		// const queries = query
		// 	.split(";")
		// 	.map((q) => q.trim())
		// 	.filter((q) => q.length > 0);

		// const results = [];

		// for (const q of queries) {
		// 	const [rows, fields] = await db.execute(q);

		// 	if (q.toLowerCase().trim().startsWith("select")) {
		// 		if (Array.isArray(rows) && rows.length > 0) {
		// 			results.push({
		// 				type: "result",
		// 				data: rows.map((row) => {
		// 					const plainRow: Record<string, string | number> = {};
		// 					for (const [key, value] of Object.entries(row)) {
		// 						if (typeof value === "string" || typeof value === "number") {
		// 							plainRow[key] = value;
		// 						}
		// 					}
		// 					return plainRow;
		// 				}),
		// 			});
		// 		} else {
		// 			results.push({
		// 				type: "message",
		// 				message: "Query executed successfully - No data returned",
		// 			});
		// 		}
		// 	} else {
		// 		// For non-SELECT queries
		// 		results.push({
		// 			type: "message",
		// 			message: `Query executed successfully - ${
		// 				rows.affectedRows || 0
		// 			} row(s) affected`,
		// 		});
		// 	}
		// }

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
