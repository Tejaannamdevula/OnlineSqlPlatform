"use client";

import { useState, useEffect } from "react";
import MDEditor from "@uiw/react-md-editor";
import { getCommands, getExtraCommands } from "@uiw/react-md-editor/commands";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveProblem } from "@/app/actions/saveProblem";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { getTags } from "@/app/actions/getTags";

interface TestCase {
	inputData: string;
	isHidden: boolean;
}

interface Tag {
	id: string;
	name: string;
}

interface ProblemData {
	title: string;
	description: string;
	sqlBoilerplate: string;
	sqlSolution: string;
	difficulty: "easy" | "medium" | "hard";
	hidden: boolean;
	tags: string[];
	testCases: TestCase[];
}

export default function Admin() {
	const [title, setTitle] = useState("");
	const [value, setValue] = useState("");
	const [sqlBoilerplate, setSqlBoilerplate] = useState("");
	const [sqlSolution, setSqlSolution] = useState("");
	const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
		"medium"
	);
	const [hidden, setHidden] = useState(false);
	const [loading, setLoading] = useState(false);
	const [allTags, setAllTags] = useState<Tag[]>([]);
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [newTag, setNewTag] = useState("");
	const [testCases, setTestCases] = useState<TestCase[]>([
		{ inputData: "", isHidden: false },
	]);
	const { toast } = useToast();

	useEffect(() => {
		const loadTags = async () => {
			try {
				const tags = await getTags();
				setAllTags(tags);
			} catch (error) {
				toast({
					title: "Error",
					description: "Failed to load tags",
					variant: "destructive",
				});
			}
		};
		loadTags();
	}, [toast]);

	const validateForm = (): boolean => {
		if (!title.trim()) {
			toast({
				title: "Validation Error",
				description: "Title is required",
				variant: "destructive",
			});
			return false;
		}
		if (!value.trim()) {
			toast({
				title: "Validation Error",
				description: "Description is required",
				variant: "destructive",
			});
			return false;
		}
		if (!sqlBoilerplate.trim()) {
			toast({
				title: "Validation Error",
				description: "SQL boilerplate code is required",
				variant: "destructive",
			});
			return false;
		}
		if (!sqlSolution.trim()) {
			toast({
				title: "Validation Error",
				description: "SQL solution is required",
				variant: "destructive",
			});
			return false;
		}
		// Validate test cases
		if (testCases.some((tc) => !tc.inputData.trim())) {
			toast({
				title: "Validation Error",
				description: "All test cases must have input data",
				variant: "destructive",
			});
			return false;
		}
		return true;
	};

	const handleSave = async () => {
		if (!validateForm()) return;

		try {
			setLoading(true);

			const problemData: ProblemData = {
				title,
				description: value,
				sqlBoilerplate,
				sqlSolution,
				difficulty,
				hidden,
				tags: selectedTags,
				testCases,
			};

			const result = await saveProblem(problemData);

			if (result.success) {
				toast({
					title: "Success",
					description: "Problem saved successfully",
				});
				setTitle("");
				setValue("");
				setSqlBoilerplate("");
				setSqlSolution("");
				setDifficulty("medium");
				setHidden(false);
				setSelectedTags([]);
				setTestCases([{ inputData: "", isHidden: false }]);
			} else {
				toast({
					title: "Error",
					description: result.error || "Failed to save problem",
					variant: "destructive",
				});
			}
		} catch (error) {
			toast({
				title: "Error",
				description: "An unexpected error occurred",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const addTag = () => {
		if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
			setSelectedTags([...selectedTags, newTag.trim()]);
			setNewTag("");
		}
	};

	const removeTag = (tag: string) => {
		setSelectedTags(selectedTags.filter((t) => t !== tag));
	};

	const addTestCase = () => {
		setTestCases([...testCases, { inputData: "", isHidden: false }]);
	};

	const updateTestCase = <K extends keyof TestCase>(
		index: number,
		field: K,
		value: TestCase[K]
	) => {
		const updatedTestCases = [...testCases];
		updatedTestCases[index][field] = value;
		setTestCases(updatedTestCases);
	};

	const removeTestCase = (index: number) => {
		if (testCases.length > 1) {
			setTestCases(testCases.filter((_, i) => i !== index));
		}
	};

	return (
		<div className="max-w-4xl mx-auto p-6 space-y-6">
			<div className="space-y-4">
				<div>
					<h2 className="text-sm font-medium mb-2">Title</h2>
					<Input
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="Enter problem title..."
						className="w-full bg-white"
					/>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<h2 className="text-sm font-medium mb-2">Difficulty</h2>
						<Select
							value={difficulty}
							onValueChange={(value) =>
								setDifficulty(value as "easy" | "medium" | "hard")
							}
						>
							<SelectTrigger className="bg-white">
								<SelectValue placeholder="Select difficulty" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="easy">Easy</SelectItem>
								<SelectItem value="medium">Medium</SelectItem>
								<SelectItem value="hard">Hard</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-end">
						<div className="flex items-center space-x-2">
							<Checkbox
								id="hidden"
								checked={hidden}
								onCheckedChange={(checked) => setHidden(checked === true)}
							/>
							<label htmlFor="hidden" className="text-sm font-medium">
								Hidden Problem
							</label>
						</div>
					</div>
				</div>

				<div>
					<h2 className="text-sm font-medium mb-2">Description</h2>
					<div className="border rounded-md overflow-hidden bg-white">
						<MDEditor
							value={value}
							preview="edit"
							commands={[...getCommands()]}
							extraCommands={[...getExtraCommands()]}
							onChange={(value) => setValue(value || "")}
							height={400}
							className="w-full"
						/>
					</div>
				</div>

				<div>
					<h2 className="text-sm font-medium mb-2">Tags</h2>
					<div className="flex flex-wrap gap-2 mb-2">
						{selectedTags.map((tag) => (
							<Badge key={tag} className="flex items-center gap-1">
								{tag}
								<button onClick={() => removeTag(tag)} className="ml-1">
									<X className="h-3 w-3" />
								</button>
							</Badge>
						))}
					</div>
					<div className="flex gap-2">
						<Input
							value={newTag}
							onChange={(e) => setNewTag(e.target.value)}
							placeholder="Add a tag..."
							className="bg-white"
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									addTag();
								}
							}}
						/>
						<Button onClick={addTag} size="sm" variant="outline">
							<Plus className="h-4 w-4 mr-1" /> Add
						</Button>
					</div>
					{allTags.length > 0 && (
						<div className="mt-2">
							<p className="text-xs text-gray-500 mb-1">Suggested tags:</p>
							<div className="flex flex-wrap gap-1">
								{allTags.map((tag) => (
									<Badge
										key={tag.id}
										variant="outline"
										className="cursor-pointer hover:bg-gray-100"
										onClick={() => {
											if (!selectedTags.includes(tag.name)) {
												setSelectedTags([...selectedTags, tag.name]);
											}
										}}
									>
										{tag.name}
									</Badge>
								))}
							</div>
						</div>
					)}
				</div>

				<div>
					<h2 className="text-sm font-medium mb-2">SQL Boilerplate Code</h2>
					<Textarea
						value={sqlBoilerplate}
						onChange={(e) => setSqlBoilerplate(e.target.value)}
						placeholder="Enter SQL boilerplate code..."
						className="min-h-[150px] font-mono text-sm bg-white"
					/>
				</div>

				<div>
					<h2 className="text-sm font-medium mb-2">SQL Solution</h2>
					<Textarea
						value={sqlSolution}
						onChange={(e) => setSqlSolution(e.target.value)}
						placeholder="Enter SQL solution code..."
						className="min-h-[150px] font-mono text-sm bg-white"
					/>
				</div>

				<div>
					<div className="flex justify-between items-center mb-2">
						<h2 className="text-sm font-medium">Test Cases</h2>
						<Button onClick={addTestCase} size="sm" variant="outline">
							<Plus className="h-4 w-4 mr-1" /> Add Test Case
						</Button>
					</div>

					{testCases.map((testCase, index) => (
						<div key={index} className="border rounded-md p-4 mb-4 bg-white">
							<div className="flex justify-between items-center mb-2">
								<h3 className="text-sm font-medium">Test Case {index + 1}</h3>
								{testCases.length > 1 && (
									<Button
										onClick={() => removeTestCase(index)}
										size="sm"
										variant="ghost"
									>
										<X className="h-4 w-4" />
									</Button>
								)}
							</div>

							<div className="space-y-3">
								<div>
									<label className="text-xs mb-1 block">
										Input Data (SQL setup)
									</label>
									<Textarea
										value={testCase.inputData}
										onChange={(e) =>
											updateTestCase(index, "inputData", e.target.value)
										}
										placeholder="SQL statements to set up the test case..."
										className="min-h-[100px] font-mono text-xs"
									/>
								</div>

								<div className="flex items-center space-x-2">
									<Checkbox
										id={`hidden-${index}`}
										checked={testCase.isHidden}
										onCheckedChange={(checked) =>
											updateTestCase(index, "isHidden", checked === true)
										}
									/>
									<label htmlFor={`hidden-${index}`} className="text-xs">
										Hidden Test Case (not shown to users)
									</label>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			<Button onClick={handleSave} disabled={loading}>
				{loading ? "Saving..." : "Save Problem"}
			</Button>
			<Toaster />
		</div>
	);
}
