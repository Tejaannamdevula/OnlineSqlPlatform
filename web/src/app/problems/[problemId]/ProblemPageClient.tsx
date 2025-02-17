"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import CodeMirrorEditor, {
	type CodeMirrorHandle,
} from "@/components/CodeMirrorEditor";
import { ProblemStatement } from "@/components/ProblemStatement";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { executeUserQuery } from "@/app/actions/playGroundAction";

interface Problem {
	id: string;
	title: string;
	description: string;
	boilerplate: string;
	expectedOutput: string;
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
}: {
	problemData: Problem | null;
}) {
	const codeEditorRef = useRef<CodeMirrorHandle | null>(null);
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isExecuting, setIsExecuting] = useState(false);
	const { toast } = useToast();

	if (!problemData) {
		return (
			<div className="flex w-screen h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white items-center justify-center">
				<h1 className="text-3xl font-bold text-red-500">Problem Not Found</h1>
				<Toaster />
			</div>
		);
	}

	const compareOutputs = (
		executionResult: QueryExecutionResult,
		expectedOutput: string
	): boolean => {
		try {
			const expectedData = JSON.parse(expectedOutput);
			const executionResultData = executionResult.data?.find(
				(item) => item.type === "result"
			);
			const expectedResultData = expectedData.solution?.find(
				(item: any) => item.type === "result"
			);

			if (!executionResultData?.data || !expectedResultData?.data) {
				return false;
			}

			return (
				JSON.stringify(executionResultData.data) ===
				JSON.stringify(expectedResultData.data)
			);
		} catch (error) {
			console.error("Error comparing outputs:", error);
			return false;
		}
	};

	const handleRunCode = async () => {
		if (!codeEditorRef.current) return;

		setIsExecuting(true);
		try {
			const userCode = codeEditorRef.current.getValue();
			const fullCode = `${problemData.boilerplate}\n${userCode}`;
			const result = await executeUserQuery(fullCode);

			if (result.error) {
				toast({
					variant: "destructive",
					title: "Error",
					description: result.error,
				});
				return;
			}

			const isCorrect = compareOutputs(result, problemData.expectedOutput);

			if (isCorrect) {
				console.log("correct");
				toast({
					title: "Success! 🎉",
					description: "Your solution is correct!",
					variant: "default",
					className: "bg-green-500 text-white",
				});
			} else {
				toast({
					variant: "destructive",
					title: "Incorrect Solution",
					description:
						"Your output doesn't match the expected result. Please try again.",
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

	return (
		<>
			<div className="flex w-screen h-screen bg-gray-50 text-gray-900 p-0 m-0">
				{/* Problem Statement */}
				<div
					className={`h-screen ${
						isCollapsed ? "w-0" : "w-full md:w-1/2"
					} transition-all duration-300 bg-white border-r border-gray-200 overflow-hidden`}
				>
					<div className="h-full p-8 overflow-auto">
						<div className="max-w-2xl mx-auto">
							<h1 className="text-3xl font-bold text-gray-900 mb-6">
								{problemData.title}
							</h1>
							<div className="prose max-w-full">
								<ProblemStatement description={problemData.description} />
							</div>
						</div>
					</div>
				</div>

				{/* Editor Collapse Button */}
				<button
					onClick={() => setIsCollapsed(!isCollapsed)}
					className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-white text-gray-600 hover:text-gray-900 p-2 rounded-r-lg shadow-md border border-gray-200 border-l-0 transition-colors"
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
						<div className="flex w-full items-center justify-center">
							<Button
								onClick={handleRunCode}
								disabled={isExecuting}
								className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
							>
								<Play size={16} />
								{isExecuting ? "Running..." : "Run Code"}
							</Button>
						</div>
					</div>
					<div className="flex-1 p-6">
						<div className="h-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
							<CodeMirrorEditor editorRef={codeEditorRef} />
						</div>
					</div>
				</div>
			</div>
			<Toaster />
		</>
	);
}
