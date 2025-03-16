// "use client";
// import { useRef, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { useToast } from "@/hooks/use-toast";
// import { Toaster } from "@/components/ui/toaster";
// import CodeMirrorEditor, {
// 	type CodeMirrorHandle,
// } from "@/components/CodeMirrorEditor";
// import { ProblemStatement } from "@/components/ProblemStatement";
// import { Play, ChevronLeft, ChevronRight, Send, LogIn } from "lucide-react";
// import {
// 	executeUserQuery,
// 	submitSolution,
// } from "@/app/actions/playGroundAction";
// import { TestCasePanel } from "@/components/TestCasePanel";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { useRouter } from "next/navigation";

// interface TestCase {
// 	id: string;
// 	inputData: string;
// 	expectedOutput: string;
// 	isHidden: boolean;
// }

// interface Problem {
// 	id: string;
// 	title: string;
// 	description: string;
// 	boilerplate: string;
// 	solution: string;
// 	difficulty: "easy" | "medium" | "hard";
// 	testCases?: TestCase[];
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

// export function ProblemPageClient({
// 	problemData,
// 	isAuthenticated = false,
// }: {
// 	problemData: Problem;
// 	isAuthenticated?: boolean;
// }) {
// 	const router = useRouter();
// 	const codeEditorRef = useRef<CodeMirrorHandle | null>(null);
// 	const [isCollapsed, setIsCollapsed] = useState(false);
// 	const [isExecuting, setIsExecuting] = useState(false);
// 	const [isSubmitting, setIsSubmitting] = useState(false);
// 	const [activeTestCase, setActiveTestCase] = useState("case-1");
// 	const [activeLeftTab, setActiveLeftTab] = useState("description");
// 	const [testResults, setTestResults] = useState<
// 		Record<string, QueryExecutionResult | null>
// 	>({});
// 	const [submissionResult, setSubmissionResult] = useState<{
// 		success: boolean;
// 		message: string;
// 		passedTests: number;
// 		totalTests: number;
// 	} | null>(null);
// 	const { toast } = useToast();

// 	if (!problemData) {
// 		return (
// 			<div className="flex w-screen h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white items-center justify-center">
// 				<h1 className="text-3xl font-bold text-red-500">Problem Not Found</h1>
// 				<Toaster />
// 			</div>
// 		);
// 	}

// 	// Filter visible test cases for the Run button
// 	const visibleTestCases =
// 		problemData.testCases?.filter((tc) => !tc.isHidden) || [];

// 	const handleRunCode = async () => {
// 		if (!codeEditorRef.current) return;

// 		setIsExecuting(true);
// 		setTestResults({});

// 		try {
// 			const userCode = codeEditorRef.current.getValue();
// 			const fullCode = `${problemData.boilerplate}\n${userCode}`;

// 			// Execute each visible test case
// 			const results: Record<string, QueryExecutionResult | null> = {};

// 			for (const testCase of visibleTestCases) {
// 				const result = await executeUserQuery({
// 					code: fullCode,
// 					testCaseId: testCase.id,
// 					problemId: problemData.id,
// 				});

// 				results[testCase.id] = result;
// 			}

// 			setTestResults(results);

// 			// Show success toast if all tests passed
// 			const allPassed = Object.values(results).every((r) => r?.success);
// 			if (allPassed) {
// 				toast({
// 					title: "All test cases passed! 🎉",
// 					description: "Try submitting your solution now.",
// 					variant: "default",
// 					className: "bg-green-500 text-white",
// 				});
// 			}
// 		} catch (error) {
// 			toast({
// 				variant: "destructive",
// 				title: "Error",
// 				description: "An unexpected error occurred while running your code.",
// 			});
// 		} finally {
// 			setIsExecuting(false);
// 		}
// 	};

// 	const handleSubmitCode = async () => {
// 		if (!codeEditorRef.current) return;

// 		// Check if user is authenticated
// 		if (!isAuthenticated) {
// 			toast({
// 				variant: "destructive",
// 				title: "Authentication Required",
// 				description: "Please log in to submit your solution.",
// 			});

// 			// Redirect to login page after a short delay
// 			setTimeout(() => {
// 				router.push("/api/login");
// 			}, 2000);

// 			return;
// 		}

// 		setIsSubmitting(true);
// 		setSubmissionResult(null);

// 		try {
// 			const userCode = codeEditorRef.current.getValue();
// 			const fullCode = `${problemData.boilerplate}\n${userCode}`;

// 			// Submit solution to run against all test cases (including hidden ones)
// 			const result = await submitSolution({
// 				code: fullCode,
// 				problemId: problemData.id,
// 			});

// 			setSubmissionResult(result);
// 			setActiveLeftTab("submission"); // Switch to submission tab after submission

// 			if (result.success) {
// 				toast({
// 					title: "Success! 🎉",
// 					description: `Your solution passed ${result.passedTests}/${result.totalTests} test cases.`,
// 					variant: "default",
// 					className: "bg-green-500 text-white",
// 				});
// 			} else {
// 				if (result.message.includes("logged in")) {
// 					// Session expired or not authenticated
// 					toast({
// 						variant: "destructive",
// 						title: "Authentication Required",
// 						description: "Your session has expired. Please log in again.",
// 					});

// 					// Redirect to login page after a short delay
// 					setTimeout(() => {
// 						router.push("/api/login");
// 					}, 2000);
// 				} else {
// 					toast({
// 						variant: "destructive",
// 						title: "Incorrect Solution",
// 						description:
// 							result.message || "Your solution didn't pass all test cases.",
// 					});
// 				}
// 			}
// 		} catch (error) {
// 			toast({
// 				variant: "destructive",
// 				title: "Error",
// 				description:
// 					"An unexpected error occurred while submitting your solution.",
// 			});
// 		} finally {
// 			setIsSubmitting(false);
// 		}
// 	};

// 	return (
// 		<>
// 			<div className="flex w-screen h-screen bg-gray-50 text-gray-900 p-0 m-0">
// 				{/* Problem Statement */}
// 				<div
// 					className={`h-screen ${
// 						isCollapsed ? "w-0" : "w-full md:w-1/2"
// 					} transition-all duration-300 bg-white border-r border-gray-200 overflow-hidden`}
// 				>
// 					<div className="h-full overflow-auto">
// 						<div className="max-w-2xl mx-auto p-8">
// 							<div className="flex items-center gap-2 mb-4">
// 								<h1 className="text-3xl font-bold text-gray-900">
// 									{problemData.title}
// 								</h1>
// 								<Badge
// 									className={
// 										problemData.difficulty === "easy"
// 											? "bg-green-500"
// 											: problemData.difficulty === "medium"
// 											? "bg-yellow-500"
// 											: "bg-red-500"
// 									}
// 								>
// 									{problemData.difficulty}
// 								</Badge>
// 							</div>

// 							{/* Tabs for Description and Submission */}
// 							<Tabs
// 								value={activeLeftTab}
// 								onValueChange={setActiveLeftTab}
// 								className="w-full mb-6"
// 							>
// 								<div className="border-b border-gray-200">
// 									<TabsList className="bg-transparent">
// 										<TabsTrigger value="description" className="px-6">
// 											Description
// 										</TabsTrigger>
// 										<TabsTrigger value="submission" className="px-6">
// 											Submission Results
// 										</TabsTrigger>
// 									</TabsList>
// 								</div>

// 								<TabsContent value="description" className="pt-4">
// 									<div className="prose max-w-full">
// 										<ProblemStatement description={problemData.description} />
// 									</div>
// 								</TabsContent>

// 								<TabsContent value="submission" className="pt-4">
// 									{submissionResult ? (
// 										<div
// 											className={`p-4 rounded-md ${
// 												submissionResult.success
// 													? "bg-green-50 text-green-800 border border-green-200"
// 													: "bg-red-50 text-red-800 border border-red-200"
// 											}`}
// 										>
// 											<h3 className="font-bold text-lg mb-2">
// 												{submissionResult.success
// 													? "All tests passed!"
// 													: "Some tests failed"}
// 											</h3>
// 											<p>{submissionResult.message}</p>
// 											<div className="mt-2 font-medium">
// 												Passed {submissionResult.passedTests} of{" "}
// 												{submissionResult.totalTests} test cases
// 											</div>
// 										</div>
// 									) : (
// 										<div className="text-center py-8 text-gray-500">
// 											No submission results yet. Submit your solution to see
// 											results here.
// 										</div>
// 									)}
// 								</TabsContent>
// 							</Tabs>
// 						</div>
// 					</div>
// 				</div>

// 				{/* Editor Collapse Button */}
// 				<button
// 					onClick={() => setIsCollapsed(!isCollapsed)}
// 					className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-white text-gray-600 hover:text-gray-900 p-2 rounded-r-lg shadow-md border border-gray-200 border-l-0 transition-colors z-10"
// 				>
// 					{isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
// 				</button>

// 				{/* Code Editor */}
// 				<div
// 					className={`h-screen ${
// 						isCollapsed ? "w-full" : "w-full md:w-1/2"
// 					} transition-all duration-300 flex flex-col bg-white`}
// 				>
// 					<div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white w-full">
// 						<div className="flex w-full items-center justify-center gap-4">
// 							<Button
// 								onClick={handleRunCode}
// 								disabled={isExecuting || isSubmitting}
// 								className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
// 							>
// 								<Play size={16} />
// 								{isExecuting ? "Running..." : "Run Code"}
// 							</Button>
// 							<Button
// 								onClick={handleSubmitCode}
// 								disabled={isExecuting || isSubmitting}
// 								className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
// 							>
// 								{isAuthenticated ? (
// 									<>
// 										<Send size={16} />
// 										{isSubmitting ? "Submitting..." : "Submit"}
// 									</>
// 								) : (
// 									<>
// 										<LogIn size={16} />
// 										Login to Submit
// 									</>
// 								)}
// 							</Button>
// 						</div>
// 					</div>

// 					<div className="flex-1 flex flex-col">
// 						<div className="flex-1 p-4">
// 							<div className="h-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
// 								<CodeMirrorEditor editorRef={codeEditorRef} />
// 							</div>
// 						</div>

// 						{/* Test Cases Panel */}
// 						<div className="border-t border-gray-200 bg-gray-50">
// 							<Tabs defaultValue="testcases" className="w-full">
// 								<div className="flex items-center px-4 py-2 border-b border-gray-200">
// 									<TabsList className="bg-gray-100">
// 										<TabsTrigger value="testcases">Test Cases</TabsTrigger>
// 									</TabsList>
// 								</div>

// 								<TabsContent value="testcases" className="p-4">
// 									{visibleTestCases.length > 0 ? (
// 										<div className="space-y-4">
// 											<Tabs
// 												value={activeTestCase}
// 												onValueChange={setActiveTestCase}
// 											>
// 												<TabsList className="mb-4">
// 													{visibleTestCases.map((testCase, index) => (
// 														<TabsTrigger
// 															key={testCase.id}
// 															value={`case-${index + 1}`}
// 															className={
// 																testResults[testCase.id]?.success
// 																	? "border-green-500 text-green-600"
// 																	: testResults[testCase.id] &&
// 																	  !testResults[testCase.id]?.success
// 																	? "border-red-500 text-red-600"
// 																	: ""
// 															}
// 														>
// 															Case {index + 1}
// 														</TabsTrigger>
// 													))}
// 												</TabsList>

// 												{visibleTestCases.map((testCase, index) => (
// 													<TabsContent
// 														key={testCase.id}
// 														value={`case-${index + 1}`}
// 													>
// 														<TestCasePanel
// 															testCase={testCase}
// 															result={testResults[testCase.id]}
// 														/>
// 													</TabsContent>
// 												))}
// 											</Tabs>
// 										</div>
// 									) : (
// 										<div className="text-center py-4 text-gray-500">
// 											No test cases available
// 										</div>
// 									)}
// 								</TabsContent>
// 							</Tabs>
// 						</div>
// 					</div>
// 				</div>
// 			</div>
// 			<Toaster />
// 		</>
// 	);
// }

"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import CodeMirrorEditor, {
	type CodeMirrorHandle,
} from "@/components/CodeMirrorEditor";
import { ProblemStatement } from "@/components/ProblemStatement";
import { Play, ChevronLeft, ChevronRight, Send, LogIn } from "lucide-react";
import {
	executeUserQuery,
	submitSolution,
} from "@/app/actions/playGroundAction";
import { TestCasePanel } from "@/components/TestCasePanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
// import { ResizablePanel } from "@/components/resizable-panel";
import { ResizablePanel } from "@/components/ResizablePanel";
interface TestCase {
	id: string;
	inputData: string;
	expectedOutput: string;
	isHidden: boolean;
}

interface Problem {
	id: string;
	title: string;
	description: string;
	boilerplate: string;
	solution: string;
	difficulty: "easy" | "medium" | "hard";
	testCases?: TestCase[];
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

export function ProblemPageClient({
	problemData,
	isAuthenticated = false,
}: {
	problemData: Problem;
	isAuthenticated?: boolean;
}) {
	const router = useRouter();
	const codeEditorRef = useRef<CodeMirrorHandle | null>(null);
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isExecuting, setIsExecuting] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [activeTestCase, setActiveTestCase] = useState("case-1");
	const [activeLeftTab, setActiveLeftTab] = useState("description");
	const [editorPanelSize, setEditorPanelSize] = useState(70);
	const [testResults, setTestResults] = useState<
		Record<string, QueryExecutionResult | null>
	>({});
	const [submissionResult, setSubmissionResult] = useState<{
		success: boolean;
		message: string;
		passedTests: number;
		totalTests: number;
	} | null>(null);
	const { toast } = useToast();

	if (!problemData) {
		return (
			<div className="flex w-screen h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white items-center justify-center">
				<h1 className="text-3xl font-bold text-red-500">Problem Not Found</h1>
				<Toaster />
			</div>
		);
	}

	// Filter visible test cases for the Run button
	const visibleTestCases =
		problemData.testCases?.filter((tc) => !tc.isHidden) || [];

	const handleRunCode = async () => {
		if (!codeEditorRef.current) return;

		setIsExecuting(true);
		setTestResults({});

		try {
			const userCode = codeEditorRef.current.getValue();

			// Execute each visible test case
			const results: Record<string, QueryExecutionResult | null> = {};

			for (const testCase of visibleTestCases) {
				try {
					// Combine SQL parts directly:
					let combinedSQL = "";
					// Add test case setup SQL if available

					// Add problem boilerplate SQL
					combinedSQL += problemData.boilerplate + "\n";
					combinedSQL += testCase.inputData + "\n";

					// Add user's code
					combinedSQL += userCode;

					// Execute the combined SQL
					const result = await executeUserQuery(combinedSQL);

					// Compare with expected output to determine success
					let success = result.success;
					if (success && testCase.expectedOutput && result.data) {
						try {
							const expectedOutput = JSON.parse(testCase.expectedOutput);
							// Check if the actual output matches the expected output
							success =
								JSON.stringify(expectedOutput.data) ===
								JSON.stringify(result.data[0]?.data);
							result.success = success;
						} catch (e) {
							console.error("Error comparing outputs:", e);
						}
					}

					results[testCase.id] = result;
				} catch (testError) {
					console.error("Error executing test case:", testError);
					results[testCase.id] = {
						success: false,
						error:
							testError instanceof Error ? testError.message : "Unknown error",
					};
				}
			}

			setTestResults(results);

			// Show success toast if all tests passed
			const allPassed = Object.values(results).every((r) => r?.success);
			if (allPassed) {
				toast({
					title: "All test cases passed! 🎉",
					description: "Try submitting your solution now.",
					variant: "default",
					className: "bg-green-500 text-white",
				});
			}
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "An unexpected error occurred while running your code.",
			});
		} finally {
			setIsExecuting(false);
		}
	};
	// const handleSubmitCode = async () => {
	// 	if (!codeEditorRef.current) return;

	// 	// Check if user is authenticated
	// 	if (!isAuthenticated) {
	// 		toast({
	// 			variant: "destructive",
	// 			title: "Authentication Required",
	// 			description: "Please log in to submit your solution.",
	// 		});

	// 		// Redirect to login page after a short delay
	// 		setTimeout(() => {
	// 			router.push("/api/login");
	// 		}, 2000);

	// 		return;
	// 	}

	// 	setIsSubmitting(true);
	// 	setSubmissionResult(null);

	// 	try {
	// 		const userCode = codeEditorRef.current.getValue();
	// 		const fullCode = `${problemData.boilerplate}\n${userCode}`;

	// 		// Submit solution to run against all test cases (including hidden ones)
	// 		const result = await submitSolution({
	// 			code: fullCode,
	// 			problemId: problemData.id,
	// 		});

	// 		setSubmissionResult(result);
	// 		setActiveLeftTab("submission"); // Switch to submission tab after submission

	// 		if (result.success) {
	// 			toast({
	// 				title: "Success! 🎉",
	// 				description: `Your solution passed ${result.passedTests}/${result.totalTests} test cases.`,
	// 				variant: "default",
	// 				className: "bg-green-500 text-white",
	// 			});
	// 		} else {
	// 			if (result.message.includes("logged in")) {
	// 				// Session expired or not authenticated
	// 				toast({
	// 					variant: "destructive",
	// 					title: "Authentication Required",
	// 					description: "Your session has expired. Please log in again.",
	// 				});

	// 				// Redirect to login page after a short delay
	// 				setTimeout(() => {
	// 					router.push("/api/login");
	// 				}, 2000);
	// 			} else {
	// 				toast({
	// 					variant: "destructive",
	// 					title: "Incorrect Solution",
	// 					description:
	// 						result.message || "Your solution didn't pass all test cases.",
	// 				});
	// 			}
	// 		}
	// 	} catch (error) {
	// 		toast({
	// 			variant: "destructive",
	// 			title: "Error",
	// 			description:
	// 				"An unexpected error occurred while submitting your solution.",
	// 		});
	// 	} finally {
	// 		setIsSubmitting(false);
	// 	}
	// };
	const handleSubmitCode = async () => {
		if (!codeEditorRef.current) return;

		// Check if user is authenticated
		if (!isAuthenticated) {
			toast({
				variant: "destructive",
				title: "Authentication Required",
				description: "Please log in to submit your solution.",
			});

			// Redirect to login page after a short delay
			setTimeout(() => {
				router.push("/api/login");
			}, 2000);

			return;
		}

		setIsSubmitting(true);
		setSubmissionResult(null);

		try {
			const userCode = codeEditorRef.current.getValue();

			// Submit solution to run against all test cases (including hidden ones)
			const result = await submitSolution({
				code: userCode,
				problemId: problemData.id,
			});

			setSubmissionResult(result);
			setActiveLeftTab("submission"); // Switch to submission tab after submission

			if (result.success) {
				toast({
					title: "Success! 🎉",
					description: `Your solution passed ${result.passedTests}/${result.totalTests} test cases.`,
					variant: "default",
					className: "bg-green-500 text-white",
				});
			} else {
				if (result.message.includes("logged in")) {
					// Session expired or not authenticated
					toast({
						variant: "destructive",
						title: "Authentication Required",
						description: "Your session has expired. Please log in again.",
					});

					// Redirect to login page after a short delay
					setTimeout(() => {
						router.push("/api/login");
					}, 2000);
				} else {
					toast({
						variant: "destructive",
						title: "Incorrect Solution",
						description:
							result.message || "Your solution didn't pass all test cases.",
					});
				}
			}
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description:
					"An unexpected error occurred while submitting your solution.",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			<div className="flex w-screen h-screen bg-gray-50 text-gray-900 p-0 m-0">
				{/* Problem Statement */}
				<div
					className={`h-screen ${
						isCollapsed ? "w-0" : "w-full md:w-1/2"
					} transition-all duration-300 bg-white border-r border-gray-200 overflow-hidden`}
				>
					<div className="h-full overflow-auto">
						<div className="max-w-2xl mx-auto p-8">
							<div className="flex items-center gap-2 mb-4">
								<h1 className="text-3xl font-bold text-gray-900">
									{problemData.title}
								</h1>
								<Badge
									className={
										problemData.difficulty === "easy"
											? "bg-green-500"
											: problemData.difficulty === "medium"
											? "bg-yellow-500"
											: "bg-red-500"
									}
								>
									{problemData.difficulty}
								</Badge>
							</div>

							{/* Tabs for Description and Submission */}
							<Tabs
								value={activeLeftTab}
								onValueChange={setActiveLeftTab}
								className="w-full mb-6"
							>
								<div className="border-b border-gray-200">
									<TabsList className="bg-transparent">
										<TabsTrigger value="description" className="px-6">
											Description
										</TabsTrigger>
										<TabsTrigger value="submission" className="px-6">
											Submission Results
										</TabsTrigger>
									</TabsList>
								</div>

								<TabsContent value="description" className="pt-4">
									<div className="prose max-w-full">
										<ProblemStatement description={problemData.description} />
									</div>
								</TabsContent>

								<TabsContent value="submission" className="pt-4">
									{submissionResult ? (
										<div
											className={`p-4 rounded-md ${
												submissionResult.success
													? "bg-green-50 text-green-800 border border-green-200"
													: "bg-red-50 text-red-800 border border-red-200"
											}`}
										>
											<h3 className="font-bold text-lg mb-2">
												{submissionResult.success
													? "All tests passed!"
													: "Some tests failed"}
											</h3>
											<p>{submissionResult.message}</p>
											<div className="mt-2 font-medium">
												Passed {submissionResult.passedTests} of{" "}
												{submissionResult.totalTests} test cases
											</div>
										</div>
									) : (
										<div className="text-center py-8 text-gray-500">
											No submission results yet. Submit your solution to see
											results here.
										</div>
									)}
								</TabsContent>
							</Tabs>
						</div>
					</div>
				</div>

				{/* Editor Collapse Button */}
				<button
					onClick={() => setIsCollapsed(!isCollapsed)}
					className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-white text-gray-600 hover:text-gray-900 p-2 rounded-r-lg shadow-md border border-gray-200 border-l-0 transition-colors z-10"
				>
					{isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
				</button>

				{/* Code Editor */}
				<div
					className={`h-screen ${
						isCollapsed ? "w-full" : "w-full md:w-1/2"
					} transition-all duration-300 flex flex-col bg-white`}
				>
					<div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white w-full">
						<div className="flex w-full items-center justify-center gap-4">
							<Button
								onClick={handleRunCode}
								disabled={isExecuting || isSubmitting}
								className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
							>
								<Play size={16} />
								{isExecuting ? "Running..." : "Run Code"}
							</Button>
							<Button
								onClick={handleSubmitCode}
								disabled={isExecuting || isSubmitting}
								className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
							>
								{isAuthenticated ? (
									<>
										<Send size={16} />
										{isSubmitting ? "Submitting..." : "Submit"}
									</>
								) : (
									<>
										<LogIn size={16} />
										Login to Submit
									</>
								)}
							</Button>
						</div>
					</div>

					<div className="flex-1 flex flex-col">
						{/* Resizable Editor and Test Cases */}
						<ResizablePanel
							direction="vertical"
							defaultSize={editorPanelSize}
							minSize={30}
							maxSize={90}
							onResize={setEditorPanelSize}
							className="h-full"
						>
							<div className="p-4 h-full">
								<div className="h-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
									<CodeMirrorEditor editorRef={codeEditorRef} />
								</div>
							</div>

							{/* Test Cases Panel */}
							<div className="bg-gray-50 h-full">
								<Tabs defaultValue="testcases" className="w-full h-full">
									<div className="flex items-center px-4 py-2 border-b border-gray-200">
										<TabsList className="bg-gray-100">
											<TabsTrigger value="testcases">Test Cases</TabsTrigger>
										</TabsList>
									</div>

									<TabsContent
										value="testcases"
										className="p-4 h-full overflow-auto"
									>
										{visibleTestCases.length > 0 ? (
											<div className="space-y-4">
												<Tabs
													value={activeTestCase}
													onValueChange={setActiveTestCase}
												>
													<TabsList className="mb-4">
														{visibleTestCases.map((testCase, index) => (
															<TabsTrigger
																key={testCase.id}
																value={`case-${index + 1}`}
																className={
																	testResults[testCase.id]?.success
																		? "border-green-500 text-green-600"
																		: testResults[testCase.id] &&
																		  !testResults[testCase.id]?.success
																		? "border-red-500 text-red-600"
																		: ""
																}
															>
																Case {index + 1}
															</TabsTrigger>
														))}
													</TabsList>

													{visibleTestCases.map((testCase, index) => (
														<TabsContent
															key={testCase.id}
															value={`case-${index + 1}`}
														>
															<TestCasePanel
																testCase={testCase}
																result={testResults[testCase.id]}
															/>
														</TabsContent>
													))}
												</Tabs>
											</div>
										) : (
											<div className="text-center py-4 text-gray-500">
												No test cases available
											</div>
										)}
									</TabsContent>
								</Tabs>
							</div>
						</ResizablePanel>
					</div>
				</div>
			</div>
			<Toaster />
		</>
	);
}

// "use client";
// import { Toaster } from "@/components/ui/toaster";
// import { useToast } from "@/hooks/use-toast";
// import { useState, useRef } from "react";
// import { CodeMirrorHandle } from "@/components/CodeMirrorEditor";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { ProblemStatement } from "@/components/ProblemStatement";
// import { Badge } from "@/components/ui/badge";

// type TestCase = {
// 	id: string;
// 	inputData: string;
// 	expectedOutput: string;
// 	isHidden: boolean;
// };
// type Problem = {
// 	id: string;
// 	title: string;
// 	description: string;
// 	boilerplate: string;
// 	solution: string;
// 	difficulty: "easy" | "medium" | "hard";
// 	testCases?: TestCase[];
// };

// export default function ProblemPageClient({
// 	problemData,
// 	isAuthenticated = false,
// }: {
// 	problemData: Problem;
// 	isAuthenticated?: boolean;
// }) {
// 	const { toast } = useToast();
// 	console.log("Problem Data ", problemData);

// 	if (!problemData) {
// 		return (
// 			<div className="h-screen w-screen justify-center items-center">
// 				<h1 className="text-3xl"> Problem Not Foussn</h1>
// 			</div>
// 		);
// 	}

// 	const sampleTestCases =
// 		problemData.testCases?.filter((tc) => !tc.isHidden) || [];

// 	const codeEditorRef = useRef<CodeMirrorHandle | null>(null);

// 	return (
// 		<div className="flex h-screen w-screen overflow-hidden bg-gray-50">
// 			<div className="w-1/2 h-full">
// 				{/*  title , difficulty */}
// 				<div className="flex items-center justify-between">
// 					<div className="flex items-center gap-2">
// 						<h1 className="text-4xl font-bold text-gray-900">
// 							{problemData.title}
// 						</h1>
// 						<Badge
// 							className={
// 								problemData.difficulty === "easy"
// 									? "bg-green-500"
// 									: problemData.difficulty === "medium"
// 									? "bg-yellow-500"
// 									: "bg-red-500"
// 							}
// 						>
// 							{problemData.difficulty}
// 						</Badge>
// 					</div>
// 				</div>

// 				<Tabs defaultValue="description" className=" w-full h-full ">
// 					<TabsList>
// 						<TabsTrigger value="description">Description</TabsTrigger>
// 						<TabsTrigger value="submissions">Submissions</TabsTrigger>
// 					</TabsList>
// 					<TabsContent value="description">
// 						<div className="prose max-w-full">
// 							<ProblemStatement description={problemData.description} />
// 						</div>
// 					</TabsContent>
// 					<TabsContent value="submissions">
// 						Change your password here.
// 					</TabsContent>
// 				</Tabs>
// 			</div>

// 			<div className="w-1/2 h-full bg-blue-300">
// 				<h1 className="tex-3xl">Code Editor</h1>
// 			</div>
// 		</div>
// 	);
// }
