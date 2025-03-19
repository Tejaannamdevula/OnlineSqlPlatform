"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import {
	CalendarIcon,
	Plus,
	Trash2,
	Clock,
	AlertTriangle,
	ArrowUpDown,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createContest } from "@/app/actions/contest-actions";
import { ProblemSelector } from "./problem-selector";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Define the form schema
const formSchema = z.object({
	title: z.string().min(5, {
		message: "Title must be at least 5 characters.",
	}),
	description: z.string().min(10, {
		message: "Description must be at least 10 characters.",
	}),
	startTime: z.date({
		required_error: "Start time is required.",
	}),
	endTime: z.date({
		required_error: "End time is required.",
	}),
	visibility: z.enum(["public", "private", "archive"], {
		required_error: "Please select a visibility option.",
	}),
	showLeaderboard: z.boolean().default(true),
	registrationRequired: z.boolean().default(false),
	password: z.string().optional(),
	rules: z.string().optional(),
	timeLimit: z.number().int().min(0).optional(),
});

interface SelectedProblem {
	id: string;
	title: string;
	difficulty: "easy" | "medium" | "hard";
	points: number;
	order: number;
}

export function CreateContestForm() {
	const router = useRouter();
	const [selectedProblems, setSelectedProblems] = useState<SelectedProblem[]>(
		[]
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isProblemSelectorOpen, setIsProblemSelectorOpen] = useState(false);
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);
	const [activeTab, setActiveTab] = useState("basic");
	const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
	const formRef = useRef<HTMLFormElement>(null);

	// Initialize form with default values
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: "",
			description: "",
			visibility: "public",
			showLeaderboard: true,
			registrationRequired: false,
			startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
			endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // Default to 3 hours duration
		},
	});

	// Handle form submission
	async function onSubmit(values: z.infer<typeof formSchema>) {
		if (selectedProblems.length === 0) {
			form.setError("root", {
				message: "Please add at least one problem to the contest.",
			});
			return;
		}

		// Validate start and end times
		if (values.startTime >= values.endTime) {
			form.setError("endTime", {
				message: "End time must be after start time.",
			});
			return;
		}

		setIsSubmitting(true);

		try {
			// Format the contest data
			const contestData = {
				...values,
				problems: selectedProblems.map((p) => ({
					id: p.id,
					points: p.points,
					order: p.order,
				})),
			};

			// Submit the contest data
			const result = await createContest(contestData);

			if (result.success) {
				toast.success("Contest created successfully!");
				router.push(`/admin/contests/${result.contestId}`);
				router.refresh();
			} else {
				toast.error(result.error || "Failed to create contest");
				form.setError("root", {
					message: result.error || "Failed to create contest",
				});
			}
		} catch (error) {
			console.error("Error creating contest:", error);
			toast.error("An unexpected error occurred");
			form.setError("root", {
				message: "An unexpected error occurred. Please try again.",
			});
		} finally {
			setIsSubmitting(false);
			setConfirmDialogOpen(false);
		}
	}

	// Add a problem to the contest
	const addProblem = (problem: Omit<SelectedProblem, "order">) => {
		if (!selectedProblems.some((p) => p.id === problem.id)) {
			setSelectedProblems([
				...selectedProblems,
				{ ...problem, order: selectedProblems.length },
			]);
		}
		setIsProblemSelectorOpen(false);
	};

	// Remove a problem from the contest
	const removeProblem = (problemId: string) => {
		const newProblems = selectedProblems.filter((p) => p.id !== problemId);
		// Update order after removal
		const reorderedProblems = newProblems.map((p, index) => ({
			...p,
			order: index,
		}));
		setSelectedProblems(reorderedProblems);
	};

	// Update problem points
	const updateProblemPoints = (problemId: string, points: number) => {
		setSelectedProblems(
			selectedProblems.map((p) => (p.id === problemId ? { ...p, points } : p))
		);
	};

	// Handle drag and drop reordering
	const handleDragEnd = (result: any) => {
		if (!result.destination) return;

		const items = Array.from(selectedProblems);
		const [reorderedItem] = items.splice(result.source.index, 1);
		items.splice(result.destination.index, 0, reorderedItem);

		// Update order property
		const reorderedProblems = items.map((item, index) => ({
			...item,
			order: index,
		}));

		setSelectedProblems(reorderedProblems);
	};

	// Generate default points based on difficulty
	const getDefaultPoints = (difficulty: "easy" | "medium" | "hard") => {
		switch (difficulty) {
			case "easy":
				return 100;
			case "medium":
				return 200;
			case "hard":
				return 300;
			default:
				return 100;
		}
	};

	// Calculate contest duration in hours
	const getDurationHours = () => {
		const startTime = form.getValues("startTime");
		const endTime = form.getValues("endTime");

		if (!startTime || !endTime) return 0;

		const durationMs = endTime.getTime() - startTime.getTime();
		return Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10; // Round to 1 decimal place
	};

	// Set duration in hours
	const setDurationHours = (hours: number) => {
		const startTime = form.getValues("startTime");
		if (!startTime) return;

		const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);
		form.setValue("endTime", endTime);
	};

	// Preview contest
	const handlePreview = () => {
		if (selectedProblems.length === 0) {
			toast.error("Please add at least one problem to the contest");
			return;
		}

		setIsPreviewOpen(true);
	};

	// Handle form submission with confirmation
	const handleFormSubmit = () => {
		if (selectedProblems.length === 0) {
			toast.error("Please add at least one problem to the contest");
			return;
		}

		// Show confirmation dialog
		setConfirmDialogOpen(true);
	};

	return (
		<div className="space-y-8">
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="basic">Basic Information</TabsTrigger>
					<TabsTrigger value="problems">Problems</TabsTrigger>
					<TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
				</TabsList>

				<Form {...form}>
					<form
						ref={formRef}
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-8 mt-6"
					>
						<TabsContent value="basic" className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-6">
									<FormField
										control={form.control}
										name="title"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Contest Title</FormLabel>
												<FormControl>
													<Input
														placeholder="SQL Masters Challenge"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="description"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Description</FormLabel>
												<FormControl>
													<Textarea
														placeholder="Describe the contest, rules, and any special instructions..."
														className="min-h-[120px]"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<div className="space-y-6">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="startTime"
											render={({ field }) => (
												<FormItem className="flex flex-col">
													<FormLabel>Start Time</FormLabel>
													<Popover>
														<PopoverTrigger asChild>
															<FormControl>
																<Button
																	variant={"outline"}
																	className={cn(
																		"w-full pl-3 text-left font-normal",
																		!field.value && "text-muted-foreground"
																	)}
																>
																	{field.value ? (
																		format(field.value, "PPP HH:mm")
																	) : (
																		<span>Pick a date</span>
																	)}
																	<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
																</Button>
															</FormControl>
														</PopoverTrigger>
														<PopoverContent
															className="w-auto p-0"
															align="start"
														>
															<Calendar
																mode="single"
																selected={field.value}
																onSelect={field.onChange}
																initialFocus
															/>
															<div className="p-3 border-t border-border">
																<Input
																	type="time"
																	value={
																		field.value
																			? format(field.value, "HH:mm")
																			: ""
																	}
																	onChange={(e) => {
																		const [hours, minutes] =
																			e.target.value.split(":");
																		const newDate = field.value
																			? new Date(field.value)
																			: new Date();
																		newDate.setHours(
																			Number.parseInt(hours, 10)
																		);
																		newDate.setMinutes(
																			Number.parseInt(minutes, 10)
																		);
																		field.onChange(newDate);
																	}}
																/>
															</div>
														</PopoverContent>
													</Popover>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="endTime"
											render={({ field }) => (
												<FormItem className="flex flex-col">
													<FormLabel>End Time</FormLabel>
													<Popover>
														<PopoverTrigger asChild>
															<FormControl>
																<Button
																	variant={"outline"}
																	className={cn(
																		"w-full pl-3 text-left font-normal",
																		!field.value && "text-muted-foreground"
																	)}
																>
																	{field.value ? (
																		format(field.value, "PPP HH:mm")
																	) : (
																		<span>Pick a date</span>
																	)}
																	<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
																</Button>
															</FormControl>
														</PopoverTrigger>
														<PopoverContent
															className="w-auto p-0"
															align="start"
														>
															<Calendar
																mode="single"
																selected={field.value}
																onSelect={field.onChange}
																initialFocus
															/>
															<div className="p-3 border-t border-border">
																<Input
																	type="time"
																	value={
																		field.value
																			? format(field.value, "HH:mm")
																			: ""
																	}
																	onChange={(e) => {
																		const [hours, minutes] =
																			e.target.value.split(":");
																		const newDate = field.value
																			? new Date(field.value)
																			: new Date();
																		newDate.setHours(
																			Number.parseInt(hours, 10)
																		);
																		newDate.setMinutes(
																			Number.parseInt(minutes, 10)
																		);
																		field.onChange(newDate);
																	}}
																/>
															</div>
														</PopoverContent>
													</Popover>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<div className="flex items-center gap-2">
										<Clock className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm text-muted-foreground">
											Duration: {getDurationHours()} hours
										</span>
										<div className="flex-1"></div>
										<div className="flex gap-2">
											{[1, 2, 3, 5, 24].map((hours) => (
												<Button
													key={hours}
													variant="outline"
													size="sm"
													type="button"
													onClick={() => setDurationHours(hours)}
												>
													{hours}h
												</Button>
											))}
										</div>
									</div>

									<FormField
										control={form.control}
										name="visibility"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Visibility</FormLabel>
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Select visibility" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="public">Public</SelectItem>
														<SelectItem value="private">Private</SelectItem>
														<SelectItem value="archive">Archive</SelectItem>
													</SelectContent>
												</Select>
												<FormDescription>
													Public contests are visible to all users. Private
													contests require registration.
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="showLeaderboard"
										render={({ field }) => (
											<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
												<div className="space-y-0.5">
													<FormLabel className="text-base">
														Show Leaderboard
													</FormLabel>
													<FormDescription>
														Display a real-time leaderboard during the contest
													</FormDescription>
												</div>
												<FormControl>
													<Switch
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
											</FormItem>
										)}
									/>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="problems" className="space-y-6">
							<div className="flex items-center justify-between">
								<h2 className="text-xl font-semibold">Contest Problems</h2>
								<Dialog
									open={isProblemSelectorOpen}
									onOpenChange={setIsProblemSelectorOpen}
								>
									<DialogTrigger asChild>
										<Button>
											<Plus className="mr-2 h-4 w-4" />
											Add Problems
										</Button>
									</DialogTrigger>
									<DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
										<DialogHeader>
											<DialogTitle>Select Problems</DialogTitle>
											<DialogDescription>
												Search and filter problems to add to your contest.
											</DialogDescription>
										</DialogHeader>
										<div className="flex-1 overflow-hidden">
											<ProblemSelector
												onSelectProblem={(problem) =>
													addProblem({
														id: problem.id,
														title: problem.title,
														difficulty: problem.difficulty,
														points: getDefaultPoints(problem.difficulty),
													})
												}
												selectedProblemIds={selectedProblems.map((p) => p.id)}
											/>
										</div>
										<DialogFooter>
											<Button
												variant="outline"
												onClick={() => setIsProblemSelectorOpen(false)}
											>
												Close
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>
							</div>

							{selectedProblems.length === 0 ? (
								<Card>
									<CardContent className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
										<div className="mb-4 rounded-full bg-muted p-3">
											<Plus className="h-6 w-6" />
										</div>
										<p>No problems added yet</p>
										<p className="text-sm">
											Click "Add Problems" to select problems for this contest
										</p>
									</CardContent>
								</Card>
							) : (
								<div className="border rounded-md">
									<DragDropContext onDragEnd={handleDragEnd}>
										<Droppable droppableId="problems">
											{(provided) => (
												<div
													{...provided.droppableProps}
													ref={provided.innerRef}
												>
													<Table>
														<TableHeader>
															<TableRow>
																<TableHead className="w-[50px]">#</TableHead>
																<TableHead>Problem</TableHead>
																<TableHead>Difficulty</TableHead>
																<TableHead className="w-[150px]">
																	Points
																</TableHead>
																<TableHead className="w-[100px]">
																	Actions
																</TableHead>
															</TableRow>
														</TableHeader>
														<TableBody>
															{selectedProblems.map((problem, index) => (
																<Draggable
																	key={problem.id}
																	draggableId={problem.id}
																	index={index}
																>
																	{(provided) => (
																		<TableRow
																			ref={provided.innerRef}
																			{...provided.draggableProps}
																			{...provided.dragHandleProps}
																		>
																			<TableCell>
																				<div className="flex items-center gap-2">
																					<ArrowUpDown className="h-4 w-4 text-muted-foreground" />
																					{index + 1}
																				</div>
																			</TableCell>
																			<TableCell>{problem.title}</TableCell>
																			<TableCell>
																				<Badge
																					className={cn(
																						problem.difficulty === "easy" &&
																							"bg-green-500",
																						problem.difficulty === "medium" &&
																							"bg-yellow-500",
																						problem.difficulty === "hard" &&
																							"bg-red-500"
																					)}
																				>
																					{problem.difficulty}
																				</Badge>
																			</TableCell>
																			<TableCell>
																				<Input
																					type="number"
																					min="1"
																					max="1000"
																					value={problem.points}
																					onChange={(e) =>
																						updateProblemPoints(
																							problem.id,
																							Number.parseInt(e.target.value) ||
																								100
																						)
																					}
																					className="w-24"
																				/>
																			</TableCell>
																			<TableCell>
																				<Button
																					variant="ghost"
																					size="icon"
																					onClick={() =>
																						removeProblem(problem.id)
																					}
																				>
																					<Trash2 className="h-4 w-4 text-red-500" />
																				</Button>
																			</TableCell>
																		</TableRow>
																	)}
																</Draggable>
															))}
															{provided.placeholder}
														</TableBody>
													</Table>
												</div>
											)}
										</Droppable>
									</DragDropContext>
								</div>
							)}

							<div className="flex justify-between items-center">
								<div className="text-sm text-muted-foreground">
									{selectedProblems.length} problem
									{selectedProblems.length !== 1 ? "s" : ""} selected
								</div>
								<div className="flex gap-2">
									<Button
										type="button"
										variant="outline"
										onClick={() => {
											// Auto-assign points based on difficulty
											setSelectedProblems(
												selectedProblems.map((p) => ({
													...p,
													points: getDefaultPoints(p.difficulty),
												}))
											);
										}}
									>
										Auto-assign Points
									</Button>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="advanced" className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-6">
									<FormField
										control={form.control}
										name="registrationRequired"
										render={({ field }) => (
											<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
												<div className="space-y-0.5">
													<FormLabel className="text-base">
														Registration Required
													</FormLabel>
													<FormDescription>
														Users must register before participating in the
														contest
													</FormDescription>
												</div>
												<FormControl>
													<Switch
														checked={field.value}
														onCheckedChange={field.onChange}
													/>
												</FormControl>
											</FormItem>
										)}
									/>

									{form.watch("visibility") === "private" && (
										<FormField
											control={form.control}
											name="password"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Contest Password</FormLabel>
													<FormControl>
														<Input
															type="password"
															placeholder="Enter password for private contest"
															{...field}
															value={field.value || ""}
														/>
													</FormControl>
													<FormDescription>
														Optional: Set a password for private contests
													</FormDescription>
													<FormMessage />
												</FormItem>
											)}
										/>
									)}

									<FormField
										control={form.control}
										name="timeLimit"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Time Limit (minutes)</FormLabel>
												<FormControl>
													<Input
														type="number"
														placeholder="Enter time limit in minutes (optional)"
														{...field}
														value={field.value === undefined ? "" : field.value}
														onChange={(e) =>
															field.onChange(
																e.target.value === ""
																	? undefined
																	: Number.parseInt(e.target.value)
															)
														}
													/>
												</FormControl>
												<FormDescription>
													Optional: Set a time limit for each participant (from
													their first submission)
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<div className="space-y-6">
									<FormField
										control={form.control}
										name="rules"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Contest Rules</FormLabel>
												<FormControl>
													<Textarea
														placeholder="Enter contest rules and guidelines..."
														className="min-h-[200px]"
														{...field}
														value={field.value || ""}
													/>
												</FormControl>
												<FormDescription>
													Optional: Specify detailed rules for the contest
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</div>
						</TabsContent>

						{form.formState.errors.root && (
							<Alert variant="destructive">
								<AlertTriangle className="h-4 w-4" />
								<AlertTitle>Error</AlertTitle>
								<AlertDescription>
									{form.formState.errors.root.message}
								</AlertDescription>
							</Alert>
						)}

						<div className="flex justify-end gap-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => router.back()}
							>
								Cancel
							</Button>
							<Button type="button" variant="secondary" onClick={handlePreview}>
								Preview
							</Button>
							<Button
								type="button"
								onClick={handleFormSubmit}
								disabled={isSubmitting || selectedProblems.length === 0}
							>
								{isSubmitting ? "Creating..." : "Create Contest"}
							</Button>
						</div>
					</form>
				</Form>
			</Tabs>

			{/* Preview Dialog */}
			<Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
				<DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
					<DialogHeader>
						<DialogTitle>Contest Preview</DialogTitle>
						<DialogDescription>
							Review your contest before creating it
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-6 py-4">
						<div className="space-y-2">
							<h2 className="text-2xl font-bold">{form.getValues("title")}</h2>
							<div className="flex flex-wrap gap-2">
								<Badge variant="outline">
									<Clock className="mr-1 h-4 w-4" />
									{getDurationHours()} hours
								</Badge>
								<Badge variant="outline">{form.getValues("visibility")}</Badge>
								{form.getValues("showLeaderboard") && (
									<Badge variant="outline">Leaderboard</Badge>
								)}
								{form.getValues("registrationRequired") && (
									<Badge variant="outline">Registration Required</Badge>
								)}
								{form.getValues("password") && (
									<Badge variant="outline">Password Protected</Badge>
								)}
							</div>
						</div>

						<div className="space-y-2">
							<h3 className="text-lg font-semibold">Description</h3>
							<p className="whitespace-pre-wrap">
								{form.getValues("description")}
							</p>
						</div>

						<div className="space-y-2">
							<h3 className="text-lg font-semibold">Schedule</h3>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-sm text-muted-foreground">Start Time</p>
									<p>{format(form.getValues("startTime"), "PPP HH:mm")}</p>
								</div>
								<div>
									<p className="text-sm text-muted-foreground">End Time</p>
									<p>{format(form.getValues("endTime"), "PPP HH:mm")}</p>
								</div>
							</div>
						</div>

						{form.getValues("rules") && (
							<div className="space-y-2">
								<h3 className="text-lg font-semibold">Rules</h3>
								<p className="whitespace-pre-wrap">{form.getValues("rules")}</p>
							</div>
						)}

						<div className="space-y-2">
							<h3 className="text-lg font-semibold">
								Problems ({selectedProblems.length})
							</h3>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>#</TableHead>
										<TableHead>Problem</TableHead>
										<TableHead>Difficulty</TableHead>
										<TableHead>Points</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{selectedProblems.map((problem, index) => (
										<TableRow key={problem.id}>
											<TableCell>{index + 1}</TableCell>
											<TableCell>{problem.title}</TableCell>
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
											<TableCell>{problem.points}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
							Close Preview
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Confirmation Dialog */}
			<Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create Contest</DialogTitle>
						<DialogDescription>
							Are you sure you want to create this contest?
						</DialogDescription>
					</DialogHeader>

					<div className="py-4">
						<Alert>
							<AlertTitle className="flex items-center">
								<AlertTriangle className="mr-2 h-4 w-4" />
								Important
							</AlertTitle>
							<AlertDescription>
								Once created, the contest will be visible to users based on your
								visibility settings. Make sure all details are correct.
							</AlertDescription>
						</Alert>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setConfirmDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={form.handleSubmit(onSubmit)}
							disabled={isSubmitting}
						>
							{isSubmitting ? "Creating..." : "Confirm Creation"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
