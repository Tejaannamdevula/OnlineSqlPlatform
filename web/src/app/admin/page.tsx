"use client";

import { useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import {
	getCommands,
	getExtraCommands,
} from "@uiw/react-md-editor/commands-cn";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveProblem } from "../actions/saveProblem";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
	const [title, setTitle] = useState("");
	const [value, setValue] = useState("");
	const [boilerPlate, setBoilerPlate] = useState("");
	const [solution, setSolution] = useState("");
	const [loading, setLoading] = useState(false);
	const { toast } = useToast();
	const handleSave = async () => {
		try {
			setLoading(true);
			const result = await saveProblem({
				title,
				description: value,
				boilerplate: boilerPlate,
				solution,
			});

			if (result.success) {
				toast({
					title: "Success",
					description: "Problem saved successfully",
				});
				// Clear the form
				setTitle("");
				setValue("");
				setBoilerPlate("");
				setSolution("");
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
					<h2 className="text-sm font-medium mb-2">Boilerplate Code</h2>
					<Textarea
						value={boilerPlate}
						onChange={(e) => setBoilerPlate(e.target.value)}
						placeholder="Enter boilerplate code..."
						className="min-h-[150px] font-mono text-sm bg-white"
					/>
				</div>

				<div>
					<h2 className="text-sm font-medium mb-2">Solution</h2>
					<Textarea
						value={solution}
						onChange={(e) => setSolution(e.target.value)}
						placeholder="Enter solution code..."
						className="min-h-[150px] font-mono text-sm bg-white"
					/>
				</div>
			</div>

			<Button onClick={handleSave} disabled={loading}>
				{loading ? "Saving..." : "Save Problem"}
			</Button>
			<Toaster />
		</div>
	);
}
