"use client";

import { useState, useEffect } from "react";
import { ChevronsUpDown, Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fetchProblems } from "@/app/actions/contest";

type Problem = {
	id: string;
	title: string;
	difficulty: "easy" | "medium" | "hard";
	tags?: string[];
};

type ProblemsListProps = {
	onSelectProblem: (problem: {
		id: string;
		title: string;
		difficulty: string;
	}) => void;
};

export function ProblemsList({ onSelectProblem }: ProblemsListProps) {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [problems, setProblems] = useState<Problem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const getProblems = async () => {
			try {
				setLoading(true);
				const result = await fetchProblems({ hidden: false });
				if (result.success) {
					setProblems(result.data);
				} else {
					setError(result.error || "Failed to fetch problems");
				}
			} catch (err) {
				setError("An unexpected error occurred");
				console.error("Error fetching problems:", err);
			} finally {
				setLoading(false);
			}
		};

		getProblems();
	}, []);

	const filteredProblems = searchQuery
		? problems.filter(
				(problem) =>
					problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					problem.tags?.some((tag) =>
						tag.toLowerCase().includes(searchQuery.toLowerCase())
					)
		  )
		: problems;

	const getDifficultyColor = (difficulty: string) => {
		switch (difficulty) {
			case "easy":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
			case "medium":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
			case "hard":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
		}
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between"
				>
					<div className="flex items-center">
						<Search className="mr-2 h-4 w-4 text-muted-foreground" />
						<span className="truncate">Select problems...</span>
					</div>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[350px] p-0" align="start">
				<Command>
					<CommandInput
						placeholder="Search problems by title or tag..."
						onValueChange={setSearchQuery}
					/>
					<CommandList>
						{loading ? (
							<CommandEmpty>
								<Loader2 className="animate-spin h-6 w-6" />
							</CommandEmpty>
						) : error ? (
							<CommandEmpty>Error: {error}</CommandEmpty>
						) : filteredProblems.length === 0 ? (
							<CommandEmpty>No problems found.</CommandEmpty>
						) : (
							<CommandGroup>
								{filteredProblems.map((problem) => (
									<CommandItem
										key={problem.id}
										value={problem.title}
										onSelect={() => {
											onSelectProblem({
												id: problem.id,
												title: problem.title,
												difficulty: problem.difficulty,
											});
											setOpen(false);
										}}
										className="flex flex-col items-start py-3"
									>
										<div className="flex w-full items-center justify-between">
											<span className="font-medium">{problem.title}</span>
											<Badge
												className={cn(
													"ml-2",
													getDifficultyColor(problem.difficulty)
												)}
											>
												{problem.difficulty}
											</Badge>
										</div>
										{problem.tags && problem.tags.length > 0 && (
											<div className="mt-1 flex flex-wrap gap-1">
												{problem.tags.map((tag) => (
													<Badge
														key={tag}
														variant="outline"
														className="text-xs"
													>
														{tag}
													</Badge>
												))}
											</div>
										)}
									</CommandItem>
								))}
							</CommandGroup>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
