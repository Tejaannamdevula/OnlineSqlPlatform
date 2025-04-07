"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
	CalendarIcon,
	Clock,
	Eye,
	EyeOff,
	Lock,
	Plus,
	Shield,
	Trash2,
	Trophy,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ProblemsList } from "./problemList";
import { createContest } from "@/app/actions/contest";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

// Define the form schema
const formSchema = z
	.object({
		title: z.string().min(3, {
			message: "Title must be at least 3 characters.",
		}),
		description: z.string().min(10, {
			message: "Description must be at least 10 characters.",
		}),
		startDate: z.date({
			required_error: "Start date is required.",
		}),
		startTime: z.string({
			required_error: "Start time is required.",
		}),
		endDate: z.date({
			required_error: "End date is required.",
		}),
		endTime: z.string({
			required_error: "End time is required.",
		}),
		leaderBoard: z.boolean().default(true),
		protectedContest: z.boolean().default(false),
		password: z
			.string()
			.optional()
			.refine(
				(val) => {
					// If protectedContest is true, password must be provided and at least 6 chars
					return val === undefined || val.length === 0 || val.length >= 6;
				},
				{
					message: "Password must be at least 6 characters",
				}
			),
		problems: z
			.array(
				z.object({
					id: z.string(),
					points: z.number().min(1).max(1000),
				})
			)
			.min(1, {
				message: "You must add at least one problem to the contest.",
			}),
	})
	.refine(
		(data) => {
			const startDateTime = new Date(
				`${format(data.startDate, "yyyy-MM-dd")}T${data.startTime}`
			);
			const endDateTime = new Date(
				`${format(data.endDate, "yyyy-MM-dd")}T${data.endTime}`
			);
			return endDateTime > startDateTime;
		},
		{
			message: "End date and time must be after start date and time",
			path: ["endDate"],
		}
	)
	.refine(
		(data) => {
			// If protectedContest is true, password must be provided
			return (
				!data.protectedContest || (data.password && data.password.length >= 6)
			);
		},
		{
			message: "Password is required for protected contests",
			path: ["password"],
		}
	);

type FormValues = z.infer<typeof formSchema>;

export default function CreateContestForm() {
	const router = useRouter();
	const [selectedProblems, setSelectedProblems] = useState<
		Array<{ id: string; title: string; points: number; difficulty: string }>
	>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [formValid, setFormValid] = useState(false);

	// Initialize the form
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: "",
			description: "",
			startTime: "02:00",
			endTime: "16:00",
			leaderBoard: false,
			protectedContest: false,
			password: "", // Initialize with empty string instead of undefined
			problems: [],
		},
		mode: "onChange", // Validate on change to provide real-time feedback
	});

	// Watch for protected contest value to conditionally show password field
	const protectedContest = form.watch("protectedContest");

	// Watch form state to determine if minimum requirements are met
	useEffect(() => {
		const subscription = form.watch((value, { name, type }) => {
			const { formState } = form;
			// Check if form is valid and we have at least one problem
			const hasRequiredFields =
				!!value.title &&
				!!value.description &&
				!!value.startDate &&
				!!value.startTime &&
				!!value.endDate &&
				!!value.endTime;

			const hasValidPassword =
				!value.protectedContest ||
				(!!value.password && value.password.length >= 6);

			const hasProblems = value.problems && value.problems.length > 0;

			// Check for date/time validation
			let hasValidDates = true;
			if (
				value.startDate &&
				value.endDate &&
				value.startTime &&
				value.endTime
			) {
				const startDateTime = new Date(
					`${format(value.startDate, "yyyy-MM-dd")}T${value.startTime}`
				);
				const endDateTime = new Date(
					`${format(value.endDate, "yyyy-MM-dd")}T${value.endTime}`
				);
				hasValidDates = endDateTime > startDateTime;
			}

			// Important: Don't consider leaderBoard in validation criteria
			// The form should be valid regardless of leaderBoard's value

			// Only set formValid to true if all required conditions are met and no errors
			// Exclude leaderBoard from the validation criteria
			const errorsToConsider = { ...formState.errors };
			delete errorsToConsider.leaderBoard;

			setFormValid(
				Boolean(
					hasRequiredFields &&
						hasValidPassword &&
						hasProblems &&
						hasValidDates &&
						Object.keys(errorsToConsider).length === 0
				)
			);
		});

		return () => subscription.unsubscribe();
	}, [form]);

	// Handle form submission
	async function onSubmit(values: FormValues) {
		try {
			setIsSubmitting(true);

			// Combine date and time
			const startDateTime = new Date(
				`${format(values.startDate, "yyyy-MM-dd")}T${values.startTime}`
			);
			const endDateTime = new Date(
				`${format(values.endDate, "yyyy-MM-dd")}T${values.endTime}`
			);

			// Prepare data for submission
			const contestData = {
				title: values.title,
				description: values.description,
				startTime: startDateTime.toISOString(),
				endTime: endDateTime.toISOString(),
				leaderBoard: values.leaderBoard,
				protectedContest: values.protectedContest,
				password: values.protectedContest ? values.password : undefined,
				problems: values.problems,
			};

			// Submit to database
			const result = await createContest(contestData);

			if (result.success) {
				toast.success("Contest created", {
					description: "Your contest has been created successfully.",
				});

				// Redirect to contests page
				router.push("/admin/contests");
			} else {
				// Now TypeScript knows that in this branch, result has the error property
				toast.error("Failed to create contest", {
					description: result?.error || "An unknown error occurred.",
				});
			}
		} catch (error) {
			toast.error("Error", {
				description:
					error instanceof Error ? error.message : "An unknown error occurred.",
			});
		} finally {
			setIsSubmitting(false);
		}
	}

	// Handle adding a problem to the contest
	const addProblem = (problem: {
		id: string;
		title: string;
		difficulty: string;
	}) => {
		if (selectedProblems.some((p) => p.id === problem.id)) {
			toast.error("Problem already added", {
				description: "This problem is already in your contest.",
			});
			return;
		}

		// Make sure points is always initialized with a number
		const defaultPoints = 100;
		const newProblem = {
			...problem,
			points: defaultPoints,
		};

		setSelectedProblems((prev) => [...prev, newProblem]);
		form.setValue("problems", [
			...(form.getValues().problems || []),
			{ id: problem.id, points: defaultPoints },
		]);
	};

	// Handle removing a problem from the contest
	const removeProblem = (problemId: string) => {
		setSelectedProblems((prev) => prev.filter((p) => p.id !== problemId));
		form.setValue(
			"problems",
			form.getValues().problems.filter((p) => p.id !== problemId)
		);
	};

	// Handle updating problem points
	const updateProblemPoints = (problemId: string, points: number) => {
		// Ensure points is never undefined or less than 1
		const validPoints = Math.max(1, points || 1);

		setSelectedProblems((prev) =>
			prev.map((p) => (p.id === problemId ? { ...p, points: validPoints } : p))
		);

		form.setValue(
			"problems",
			form
				.getValues()
				.problems.map((p) =>
					p.id === problemId ? { ...p, points: validPoints } : p
				)
		);
	};

	// Get difficulty color
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
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
				<Tabs defaultValue="details" className="w-full">
					<TabsList className="grid w-full grid-cols-3 mb-8">
						<TabsTrigger value="details">Contest Details</TabsTrigger>
						<TabsTrigger value="settings">Settings & Access</TabsTrigger>
						<TabsTrigger value="problems">
							Problems ({selectedProblems.length})
						</TabsTrigger>
					</TabsList>

					<TabsContent value="details" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Basic Information</CardTitle>
								<CardDescription>
									Set the title, description, and schedule for your contest.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<FormField
									control={form.control}
									name="title"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Contest Title</FormLabel>
											<FormControl>
												<Input placeholder="Enter contest title" {...field} />
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
													placeholder="Describe your contest"
													className="min-h-32 resize-none"
													{...field}
												/>
											</FormControl>
											<FormDescription>
												Provide details about the contest, rules, and any
												special instructions.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="space-y-6">
										<FormField
											control={form.control}
											name="startDate"
											render={({ field }) => (
												<FormItem className="flex flex-col">
													<FormLabel>Start Date</FormLabel>
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
																		format(field.value, "PPP")
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
														</PopoverContent>
													</Popover>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="startTime"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Start Time</FormLabel>
													<div className="flex items-center">
														<Clock className="mr-2 h-4 w-4 text-muted-foreground" />
														<FormControl>
															<Input type="time" {...field} />
														</FormControl>
													</div>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>

									<div className="space-y-6">
										<FormField
											control={form.control}
											name="endDate"
											render={({ field }) => (
												<FormItem className="flex flex-col">
													<FormLabel>End Date</FormLabel>
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
																		format(field.value, "PPP")
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
												<FormItem>
													<FormLabel>End Time</FormLabel>
													<div className="flex items-center">
														<Clock className="mr-2 h-4 w-4 text-muted-foreground" />
														<FormControl>
															<Input type="time" {...field} />
														</FormControl>
													</div>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="settings" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Contest Settings</CardTitle>
								<CardDescription>
									Configure visibility, access, and leaderboard settings.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<FormField
									control={form.control}
									name="leaderBoard"
									render={({ field }) => (
										<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
											<div className="space-y-0.5">
												<FormLabel className="text-base flex items-center">
													<Trophy className="mr-2 h-4 w-4" />
													Leaderboard
												</FormLabel>
												<FormDescription>
													Show a public leaderboard during the contest
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

								<FormField
									control={form.control}
									name="protectedContest"
									render={({ field }) => (
										<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
											<div className="space-y-0.5">
												<FormLabel className="text-base flex items-center">
													<Shield className="mr-2 h-4 w-4" />
													Password Protection
												</FormLabel>
												<FormDescription>
													Require a password to join this contest
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

								{protectedContest && (
									<FormField
										control={form.control}
										name="password"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Contest Password</FormLabel>
												<div className="flex items-center">
													<FormControl>
														<div className="relative w-full">
															<Input
																type={showPassword ? "text" : "password"}
																placeholder="Enter password"
																{...field}
																value={field.value || ""}
															/>
															<Button
																type="button"
																variant="ghost"
																size="icon"
																className="absolute right-0 top-0 h-full"
																onClick={() => setShowPassword(!showPassword)}
															>
																{showPassword ? (
																	<EyeOff className="h-4 w-4" />
																) : (
																	<Eye className="h-4 w-4" />
																)}
															</Button>
														</div>
													</FormControl>
												</div>
												<FormDescription>
													Minimum 6 characters. Participants will need this
													password to join.
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="problems" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Contest Problems</CardTitle>
								<CardDescription>
									Add and configure problems for your contest.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<FormField
									control={form.control}
									name="problems"
									render={() => (
										<FormItem>
											<FormLabel>Add Problems</FormLabel>
											<ProblemsList onSelectProblem={addProblem} />
											<FormDescription className="mt-2">
												Search and select problems to include in your contest.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								{selectedProblems.length > 0 ? (
									<div className="mt-6">
										<h4 className="text-sm font-medium mb-3">
											Selected Problems ({selectedProblems.length})
										</h4>
										<div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
											{selectedProblems.map((problem, index) => (
												<div
													key={problem.id}
													className="flex flex-col p-3 border rounded-md bg-card hover:bg-accent/50 transition-colors"
												>
													<div className="flex items-center justify-between mb-2">
														<div className="flex items-center gap-2">
															<span className="text-sm font-medium text-muted-foreground">
																#{index + 1}
															</span>
															<span className="font-medium">
																{problem.title}
															</span>
															<span
																className={cn(
																	"text-xs px-2 py-0.5 rounded-full",
																	getDifficultyColor(problem.difficulty)
																)}
															>
																{problem.difficulty}
															</span>
														</div>
														<Button
															variant="ghost"
															size="icon"
															onClick={() => removeProblem(problem.id)}
															className="h-7 w-7"
														>
															<Trash2 className="h-4 w-4 text-destructive" />
														</Button>
													</div>
													<div className="flex items-center gap-2">
														<span className="text-sm text-muted-foreground">
															Points:
														</span>
														<Input
															type="number"
															value={problem.points}
															onChange={(e) =>
																updateProblemPoints(
																	problem.id,
																	parseInt(e.target.value) || 1
																)
															}
															className="w-20 h-8"
															min={1}
															max={1000}
														/>
													</div>
												</div>
											))}
										</div>
									</div>
								) : (
									<div className="flex flex-col items-center justify-center py-8 border border-dashed rounded-lg">
										<div className="text-center">
											<p className="text-muted-foreground">
												No problems selected yet
											</p>
											<p className="text-sm text-muted-foreground mt-1">
												Use the search above to add problems to your contest
											</p>
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				<div className="flex flex-col sm:flex-row gap-4 justify-end">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.back()}
						disabled={isSubmitting}
						className="sm:order-1 order-2"
					>
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={isSubmitting || !formValid}
						className={cn(
							"sm:order-2 order-1",
							!formValid && "opacity-50 cursor-not-allowed"
						)}
					>
						{isSubmitting ? "Creating..." : "Create Contest"}
					</Button>
				</div>
			</form>
		</Form>
	);
}
