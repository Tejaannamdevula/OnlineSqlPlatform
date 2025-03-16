// import React from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { CheckCircle, XCircle } from "lucide-react";

// import RenderTable, { TableData } from "./RenderTable";

// interface TestCase {
// 	id: string;
// 	inputData: string;
// 	expectedOutput: string;
// 	isHidden: boolean;
// }

// type QueryExecutionResult = {
// 	success: boolean;
// 	data?: Array<{
// 		type: string;
// 		data?: Array<Record<string, string | number>>;
// 		message?: string;
// 	}>;
// 	error?: string;
// };

// // Helper function to convert result data to TableData format
// const convertToTableData = (data: any): TableData => {
// 	if (!data || !Array.isArray(data) || data.length === 0) return null;

// 	// Find the first result item with table data
// 	const tableResult = data.find(
// 		(item) =>
// 			item.type === "result" && Array.isArray(item.data) && item.data.length > 0
// 	);

// 	if (!tableResult || !tableResult.data || !tableResult.data.length)
// 		return null;

// 	return {
// 		headers: Object.keys(tableResult.data[0]),
// 		rows: tableResult.data.map((row) => Object.values(row)),
// 	};
// };

// export function TestCasePanel({
// 	testCase,
// 	result,
// }: {
// 	testCase: TestCase;
// 	result: QueryExecutionResult | null;
// }) {
// 	// Parse the input data and expected output (they are stored as JSON strings)
// 	const inputData = testCase.inputData;
// 	const expectedOutput = JSON.parse(testCase.expectedOutput);

// 	// Convert expected output to TableData format if it's in the right structure
// 	const expectedTableData = convertToTableData(expectedOutput);

// 	// Also convert actual result data if available
// 	const actualTableData = result?.data ? convertToTableData(result.data) : null;

// 	// Format the data for display in case we need to fall back to raw JSON
// 	const formatData = (data: any) => {
// 		if (typeof data === "object") {
// 			return JSON.stringify(data, null, 2);
// 		}
// 		return String(data);
// 	};

// 	return (
// 		<div className="space-y-4">
// 			<Card>
// 				<CardHeader className="pb-2">
// 					<CardTitle className="text-sm font-medium">Input</CardTitle>
// 				</CardHeader>
// 				<CardContent>
// 					<pre className="bg-gray-50 p-3 rounded-md text-sm overflow-auto max-h-32">
// 						{formatData(inputData)}
// 					</pre>
// 				</CardContent>
// 			</Card>

// 			<Card>
// 				<CardHeader className="pb-2">
// 					<CardTitle className="text-sm font-medium">Expected Output</CardTitle>
// 				</CardHeader>
// 				<CardContent>
// 					{expectedTableData ? (
// 						<div className="overflow-auto max-h-64">
// 							<RenderTable data={expectedTableData} />
// 						</div>
// 					) : (
// 						<pre className="bg-gray-50 p-3 rounded-md text-sm overflow-auto max-h-32">
// 							{formatData(expectedOutput)}
// 						</pre>
// 					)}
// 				</CardContent>
// 			</Card>

// 			{result && (
// 				<Card
// 					className={result.success ? "border-green-500" : "border-red-500"}
// 				>
// 					<CardHeader className="pb-2 flex flex-row items-center justify-between">
// 						<CardTitle className="text-sm font-medium">Your Output</CardTitle>
// 						{result.success ? (
// 							<CheckCircle className="h-5 w-5 text-green-500" />
// 						) : (
// 							<XCircle className="h-5 w-5 text-red-500" />
// 						)}
// 					</CardHeader>
// 					<CardContent>
// 						{result.error ? (
// 							<div className="bg-red-50 p-3 rounded-md text-sm text-red-800 overflow-auto max-h-32">
// 								{result.error}
// 							</div>
// 						) : actualTableData ? (
// 							<div className="overflow-auto max-h-64">
// 								<RenderTable data={actualTableData} />
// 							</div>
// 						) : (
// 							<pre className="bg-gray-50 p-3 rounded-md text-sm overflow-auto max-h-32">
// 								{result.data ? formatData(result.data) : "No output"}
// 							</pre>
// 						)}
// 					</CardContent>
// 				</Card>
// 			)}
// 		</div>
// 	);
// }
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

import RenderTable, { type TableData } from "./RenderTable";

interface TestCase {
	id: string;
	inputData: string;
	expectedOutput: string;
	isHidden: boolean;
}

type QueryExecutionResult = {
	success: boolean;
	data?: Array<{
		type: string;
		data?: Array<Record<string, string | number>>;
		message?: string;
	}>;
	error?: string;
};

// Helper function to convert result data to TableData format
const convertToTableData = (data: any): TableData => {
	if (!data || !Array.isArray(data) || data.length === 0) return null;

	// Find the first result item with table data
	const tableResult = data.find(
		(item) =>
			item.type === "result" && Array.isArray(item.data) && item.data.length > 0
	);

	if (!tableResult || !tableResult.data || !tableResult.data.length)
		return null;

	return {
		headers: Object.keys(tableResult.data[0]),
		rows: tableResult.data.map((row) => Object.values(row)),
	};
};

export function TestCasePanel({
	testCase,
	result,
}: {
	testCase: TestCase;
	result: QueryExecutionResult | null;
}) {
	// Parse the expected output (stored as JSON string)
	// Add error handling for JSON parsing
	let expectedOutput;
	try {
		expectedOutput =
			typeof testCase.expectedOutput === "string"
				? JSON.parse(testCase.expectedOutput)
				: testCase.expectedOutput;
	} catch (error) {
		console.error("Error parsing expected output:", error);
		expectedOutput = testCase.expectedOutput; // Use raw value if parsing fails
	}

	// Convert expected output to TableData format if it's in the right structure
	const expectedTableData = convertToTableData(expectedOutput);

	// Also convert actual result data if available
	const actualTableData = result?.data ? convertToTableData(result.data) : null;

	// Format the data for display in case we need to fall back to raw JSON
	const formatData = (data: any) => {
		if (data === null || data === undefined) {
			return "No data";
		}
		if (typeof data === "object") {
			return JSON.stringify(data, null, 2);
		}
		return String(data);
	};

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium">
							Expected Output
						</CardTitle>
					</CardHeader>
					<CardContent>
						{expectedTableData ? (
							<div className="overflow-auto max-h-64">
								<RenderTable data={expectedTableData} />
							</div>
						) : (
							<pre className="bg-gray-50 p-3 rounded-md text-sm overflow-auto max-h-32">
								{formatData(expectedOutput)}
							</pre>
						)}
					</CardContent>
				</Card>

				{result && (
					<Card
						className={result.success ? "border-green-500" : "border-red-500"}
					>
						<CardHeader className="pb-2 flex flex-row items-center justify-between">
							<CardTitle className="text-sm font-medium">Your Output</CardTitle>
							{result.success ? (
								<CheckCircle className="h-5 w-5 text-green-500" />
							) : (
								<XCircle className="h-5 w-5 text-red-500" />
							)}
						</CardHeader>
						<CardContent>
							{result.error ? (
								<div className="bg-red-50 p-3 rounded-md text-sm text-red-800 overflow-auto max-h-32">
									{result.error}
								</div>
							) : actualTableData ? (
								<div className="overflow-auto max-h-64">
									<RenderTable data={actualTableData} />
								</div>
							) : (
								<pre className="bg-gray-50 p-3 rounded-md text-sm overflow-auto max-h-32">
									{result.data ? formatData(result.data) : "No output"}
								</pre>
							)}
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}

// export function TestCasePanel({
// 	testCase,
// 	result,
// }: {
// 	testCase: TestCase;
// 	result: QueryExecutionResult | null;
// }) {
// 	// Parse the expected output (stored as JSON string)
// 	const expectedOutput = JSON.parse(testCase.expectedOutput);

// 	// Convert expected output to TableData format if it's in the right structure
// 	const expectedTableData = convertToTableData(expectedOutput);

// 	// Also convert actual result data if available
// 	const actualTableData = result?.data ? convertToTableData(result.data) : null;

// 	// Format the data for display in case we need to fall back to raw JSON
// 	const formatData = (data: any) => {
// 		if (typeof data === "object") {
// 			return JSON.stringify(data, null, 2);
// 		}
// 		return String(data);
// 	};

// 	return (
// 		<div className="space-y-4">
// 			<div className="grid grid-cols-2 gap-4">
// 				<Card>
// 					<CardHeader className="pb-2">
// 						<CardTitle className="text-sm font-medium">
// 							Expected Output
// 						</CardTitle>
// 					</CardHeader>
// 					<CardContent>
// 						{expectedTableData ? (
// 							<div className="overflow-auto max-h-64">
// 								<RenderTable data={expectedTableData} />
// 							</div>
// 						) : (
// 							<pre className="bg-gray-50 p-3 rounded-md text-sm overflow-auto max-h-32">
// 								{formatData(expectedOutput)}
// 							</pre>
// 						)}
// 					</CardContent>
// 				</Card>

// 				{result && (
// 					<Card
// 						className={result.success ? "border-green-500" : "border-red-500"}
// 					>
// 						<CardHeader className="pb-2 flex flex-row items-center justify-between">
// 							<CardTitle className="text-sm font-medium">Your Output</CardTitle>
// 							{result.success ? (
// 								<CheckCircle className="h-5 w-5 text-green-500" />
// 							) : (
// 								<XCircle className="h-5 w-5 text-red-500" />
// 							)}
// 						</CardHeader>
// 						<CardContent>
// 							{result.error ? (
// 								<div className="bg-red-50 p-3 rounded-md text-sm text-red-800 overflow-auto max-h-32">
// 									{result.error}
// 								</div>
// 							) : actualTableData ? (
// 								<div className="overflow-auto max-h-64">
// 									<RenderTable data={actualTableData} />
// 								</div>
// 							) : (
// 								<pre className="bg-gray-50 p-3 rounded-md text-sm overflow-auto max-h-32">
// 									{result.data ? formatData(result.data) : "No output"}
// 								</pre>
// 							)}
// 						</CardContent>
// 					</Card>
// 				)}
// 			</div>
// 		</div>
// 	);
// }
