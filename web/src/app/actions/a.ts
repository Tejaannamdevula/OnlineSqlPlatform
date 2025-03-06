"use server";

import { appDb } from "@/db/postgres";
import { problems } from "@/db/postgres/schema";

import { executeUserQuery } from "./playGroundAction";
type ProblemInput = {
	title: string;
	description: string;
	boilerplate: string;
	solution: string;
};

export async function saveProblem(data: ProblemInput) {
	try {
		// Execute boilerplate SQL
		const boilerplateResult = await executeUserQuery(data.boilerplate);
		if (!boilerplateResult.success) {
			throw new Error(
				`Boilerplate execution failed: ${boilerplateResult.error}`
			);
		}

		// Execute solution SQL
		const solutionResult = await executeUserQuery(data.solution);
		if (!solutionResult.success) {
			throw new Error(`Solution execution failed: ${solutionResult.error}`);
		}

		// Store execution output
		const output = JSON.stringify({
			solution: solutionResult.data?.filter((item) => item.type !== "message"),
		});

		// Save to database
		await appDb.insert(problems).values({
			title: data.title,
			description: data.description,
			boilerplate: data.boilerplate,
			solution: data.solution,
			output: output,
		});

		return { success: true };
	} catch (error) {
		console.error("Error saving problem:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to save problem",
		};
	}
}
