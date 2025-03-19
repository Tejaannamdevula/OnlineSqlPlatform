"use client";

import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { Search, Filter, Check, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

// import { getProblems } from "@/app/actions/problem-actions";
import { getProblems } from "@/app/actions/problem-actions";
import { Skeleton } from "@/components/ui/skeleton";

interface Problem {
	id: string;
	title: string;
	difficulty: "easy" | "medium" | "hard";
	tags: { id: string; name: string }[];
}

interface ProblemSelectorProps {
	onSelectProblem: (problem: {
		id: string;
		title: string;
		difficulty: "easy" | "medium" | "hard";
	}) => void;
	selectedProblemIds: string[];
}

export function ProblemSelector({
	onSelectProblem,
	selectedProblemIds,
}: ProblemSelectorProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
	const [problems, setProblems] = useState<Problem[]>([]);
	const [loading, setLoading] = useState(true);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(
		[]
	);
	const [availableTags, setAvailableTags] = useState<
		{ id: string; name: string }[]
	>([]);
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [totalCount, setTotalCount] = useState(0);

	// Fetch problems with search, pagination, and filters
	useEffect(() => {
		const fetchProblems = async () => {
			setLoading(true);
			try {
				const result = await getProblems({
					search: debouncedSearchQuery,
					page,
					limit: 10,
					tags: selectedTags,
					difficulties: selectedDifficulties,
				});

				setProblems(result.problems);
				setTotalPages(result.totalPages);
				setTotalCount(result.totalCount || 0);

				// Extract unique tags from all problems for the filter
				if (result.availableTags) {
					setAvailableTags(result.availableTags);
				}
			} catch (error) {
				console.error("Error fetching problems:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchProblems();
	}, [debouncedSearchQuery, page, selectedTags, selectedDifficulties]);

	const handleTagToggle = (tagId: string) => {
		setSelectedTags((prev) =>
			prev.includes(tagId)
				? prev.filter((id) => id !== tagId)
				: [...prev, tagId]
		);
		setPage(1); // Reset to first page when filter changes
	};

	const handleDifficultyToggle = (difficulty: string) => {
		setSelectedDifficulties((prev) =>
			prev.includes(difficulty)
				? prev.filter((d) => d !== difficulty)
				: [...prev, difficulty]
		);
		setPage(1); // Reset to first page when filter changes
	};

	const clearFilters = () => {
		setSelectedTags([]);
		setSelectedDifficulties([]);
		setPage(1);
	};

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center space-x-2 mb-4">
				<div className="relative flex-1">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search problems..."
						className="pl-8"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>

				<Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
					<PopoverTrigger asChild>
						<Button variant="outline" className="gap-2">
							<Filter className="h-4 w-4" />
							Filter
							{(selectedTags.length > 0 || selectedDifficulties.length > 0) && (
								<Badge variant="secondary" className="ml-1">
									{selectedTags.length + selectedDifficulties.length}
								</Badge>
							)}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-80">
						<div className="space-y-4">
							<div>
								<h4 className="font-medium mb-2">Difficulty</h4>
								<div className="flex flex-wrap gap-2">
									{["easy", "medium", "hard"].map((difficulty) => (
										<Badge
											key={difficulty}
											variant={
												selectedDifficulties.includes(difficulty)
													? "default"
													: "outline"
											}
											className={cn(
												"cursor-pointer",
												difficulty === "easy" &&
													selectedDifficulties.includes(difficulty) &&
													"bg-green-500",
												difficulty === "medium" &&
													selectedDifficulties.includes(difficulty) &&
													"bg-yellow-500",
												difficulty === "hard" &&
													selectedDifficulties.includes(difficulty) &&
													"bg-red-500"
											)}
											onClick={() => handleDifficultyToggle(difficulty)}
										>
											{difficulty}
										</Badge>
									))}
								</div>
							</div>

							<Separator />

							<div>
								<h4 className="font-medium mb-2">Tags</h4>
								<ScrollArea className="h-[200px]">
									<div className="flex flex-wrap gap-2">
										{availableTags.map((tag) => (
											<Badge
												key={tag.id}
												variant={
													selectedTags.includes(tag.id) ? "default" : "outline"
												}
												className="cursor-pointer"
												onClick={() => handleTagToggle(tag.id)}
											>
												{tag.name}
											</Badge>
										))}
									</div>
								</ScrollArea>
							</div>

							<div className="flex justify-between">
								<Button variant="ghost" size="sm" onClick={clearFilters}>
									Clear filters
								</Button>
								<Button size="sm" onClick={() => setIsFilterOpen(false)}>
									Apply
								</Button>
							</div>
						</div>
					</PopoverContent>
				</Popover>
			</div>

			{/* Active filters display */}
			{(selectedTags.length > 0 || selectedDifficulties.length > 0) && (
				<div className="flex flex-wrap gap-2 mb-4">
					{selectedDifficulties.map((difficulty) => (
						<Badge
							key={difficulty}
							variant="secondary"
							className="flex items-center gap-1"
						>
							{difficulty}
							<X
								className="h-3 w-3 cursor-pointer"
								onClick={() => handleDifficultyToggle(difficulty)}
							/>
						</Badge>
					))}

					{selectedTags.map((tagId) => {
						const tag = availableTags.find((t) => t.id === tagId);
						return tag ? (
							<Badge
								key={tagId}
								variant="secondary"
								className="flex items-center gap-1"
							>
								{tag.name}
								<X
									className="h-3 w-3 cursor-pointer"
									onClick={() => handleTagToggle(tagId)}
								/>
							</Badge>
						) : null;
					})}

					<Button
						variant="ghost"
						size="sm"
						className="h-6 px-2 text-xs"
						onClick={clearFilters}
					>
						Clear all
					</Button>
				</div>
			)}

			<div className="flex-1 overflow-auto border rounded-md">
				{loading ? (
					<div className="p-4 space-y-4">
						{Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className="flex items-center space-x-4">
								<Skeleton className="h-4 w-4 rounded-full" />
								<Skeleton className="h-4 w-full" />
							</div>
						))}
					</div>
				) : problems.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-64 text-center p-4">
						<p className="text-muted-foreground mb-2">No problems found</p>
						<p className="text-sm text-muted-foreground">
							Try adjusting your search or filters
						</p>
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[50px]"></TableHead>
								<TableHead>Title</TableHead>
								<TableHead>Difficulty</TableHead>
								<TableHead>Tags</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{problems.map((problem) => {
								const isSelected = selectedProblemIds.includes(problem.id);
								return (
									<TableRow
										key={problem.id}
										className={cn(
											"cursor-pointer hover:bg-muted/50",
											isSelected && "bg-muted/30"
										)}
										onClick={() => {
											if (!isSelected) {
												onSelectProblem({
													id: problem.id,
													title: problem.title,
													difficulty: problem.difficulty,
												});
											}
										}}
									>
										<TableCell>
											<div className="flex items-center justify-center">
												{isSelected ? (
													<Check className="h-5 w-5 text-primary" />
												) : (
													<div className="h-5 w-5 rounded-full border border-muted-foreground/30" />
												)}
											</div>
										</TableCell>
										<TableCell className="font-medium">
											{problem.title}
										</TableCell>
										<TableCell>
											<Badge
												className={cn(
													problem.difficulty === "easy" && "bg-green-500",
													problem.difficulty === "medium" && "bg-yellow-500",
													problem.difficulty === "hard" && "bg-red-500"
												)}
											>
												{problem.difficulty}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="flex flex-wrap gap-1">
												{problem.tags.slice(0, 3).map((tag) => (
													<Badge
														key={tag.id}
														variant="outline"
														className="text-xs"
													>
														{tag.name}
													</Badge>
												))}
												{problem.tags.length > 3 && (
													<Badge variant="outline" className="text-xs">
														+{problem.tags.length - 3}
													</Badge>
												)}
											</div>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				)}
			</div>

			<div className="mt-4 flex items-center justify-between">
				<div className="text-sm text-muted-foreground">
					Showing {problems.length} of {totalCount} problems
				</div>

				<Pagination>
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								className={
									page <= 1
										? "pointer-events-none opacity-50"
										: "cursor-pointer"
								}
							/>
						</PaginationItem>

						{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
							// Show pages around the current page
							let pageNum;
							if (totalPages <= 5) {
								pageNum = i + 1;
							} else if (page <= 3) {
								pageNum = i + 1;
							} else if (page >= totalPages - 2) {
								pageNum = totalPages - 4 + i;
							} else {
								pageNum = page - 2 + i;
							}

							return (
								<PaginationItem key={pageNum}>
									<PaginationLink
										isActive={pageNum === page}
										onClick={() => setPage(pageNum)}
									>
										{pageNum}
									</PaginationLink>
								</PaginationItem>
							);
						})}

						<PaginationItem>
							<PaginationNext
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
								className={
									page >= totalPages
										? "pointer-events-none opacity-50"
										: "cursor-pointer"
								}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			</div>
		</div>
	);
}
