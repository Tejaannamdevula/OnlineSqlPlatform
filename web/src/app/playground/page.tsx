"use client";

import { Button } from "@/components/ui/button";
import LanguageSelect from "@/components/LanguageSelect";
import SettingsIcon from "@/components/icons/settings";
import StdInput from "@/components/StdInput";
import CodeMirrorEditor from "@/components/CodeMirrorEditor";

import {
	executeUserQuery,
	QueryExecutionResult,
} from "../actions/playGroundAction";
import QueryResult from "@/components/QueryResult";
import { TableData, QueryOutputs } from "@/components/RenderTable";
import { CodeMirrorHandle } from "@/components/CodeMirrorEditor";
import { useRef, useState } from "react";

const Playground = () => {
	const editorRef = useRef<CodeMirrorHandle | null>({ getValue: () => "" });
	const [isLoading, setIsLoading] = useState(false);
	const [queryOutputs, setQueryOutputs] = useState<QueryOutputs>([]);

	const handleRun = async () => {
		console.log("clicked run");
		if (!editorRef.current) {
			console.log("editor is not mounted");
			return;
		}

		const query = editorRef.current!.getValue();
		console.log("query is ", query);
		const trimmedQuery = query.trim();

		if (trimmedQuery === "") {
			setQueryOutputs([
				{ type: "message", data: "Error: Please enter a valid query." },
			]);
			return;
		}

		setIsLoading(true);
		try {
			const results = await executeUserQuery(query);

			if (results.success) {
				const outputs: QueryOutputs = [];

				results?.data?.forEach((result: any) => {
					if (result.type === "result" && Array.isArray(result.data)) {
						outputs.push({
							type: "table",
							data: {
								headers: Object.keys(result.data[0]),
								rows: result.data.map((row: any) => Object.values(row)),
							},
						});
					} else if (result.type === "message") {
						outputs.push({
							type: "message",
							data: result.message,
						});
					}
				});

				setQueryOutputs(outputs);
			} else {
				setQueryOutputs([
					{
						type: "message",
						data: `Error: ${results.error || "Unknown error occurred"}`,
					},
				]);
			}
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : "Query execution failed";
			setQueryOutputs([
				{
					type: "message",
					data: `Error: ${errorMessage}`,
				},
			]);
		} finally {
			setIsLoading(false);
		}
	};

	const clearConsole = () => {
		setQueryOutputs([]); // Clear the queryOutputs state
	};

	return (
		<div className="flex flex-col h-screen w-screen">
			<div>
				<h1 className=" text-3xl text-center font-bold w-screen">SQL Editor</h1>
			</div>

			<div className="flex  text-xl flex-grow  w-full">
				<div className=" flex flex-col w-3/5 bg-white h-full ">
					<div className="flex items-center justify-between bg-blue-300 w-full  p-4">
						<div className="flex space-x-2">
							<Button onClick={handleRun} disabled={isLoading}>
								{isLoading ? "Running..." : "Run Code"}
							</Button>
						</div>
						<div className=" flex  justify-between items-center space-x-4 ">
							<LanguageSelect />
							<SettingsIcon />
						</div>
					</div>

					<div className="flex flex-col  justify-between min-h-0 bg-blue-600">
						<div className="text-center  text-2xl min-h-0">Editor</div>

						<div className=" bg-green-300 h-full min-h-0">
							<CodeMirrorEditor editorRef={editorRef} />
						</div>
					</div>
				</div>
				<div className=" flex  flex-col w-2/5 h-full">
					<div className="flex p-4 justify-between space-x-2 items-center">
						<div className="flex space-x-2 justify-center items-center">
							<span>Output</span>
							{isLoading && <span className="text-sm ">Executing...</span>}
						</div>
						<div>
							<Button variant={"secondary"} onClick={clearConsole}>
								Clear Console
							</Button>
						</div>
					</div>

					<div className="flex-grow bg-blue-500 relative">
						<div className="absolute inset-0 overflow-auto">
							<div className="p-4 space-y-4">
								{queryOutputs.map((output, index) => (
									<QueryResult key={index} output={output} index={index} />
								))}
							</div>
						</div>
					</div>

					<div>
						<StdInput />
					</div>
				</div>
			</div>
		</div>
	);
};

export default Playground;
