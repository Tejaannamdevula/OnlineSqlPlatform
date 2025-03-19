"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Copy, Edit, Trash2, MoreHorizontal, Eye } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { cloneContest, deleteContest } from "@/app/actions/contest-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Contest {
	id: string;
	title: string;
	description: string;
	startTime: Date;
	endTime: Date;
	status: "Upcoming" | "Active" | "Finished";
	visibility: "public" | "private" | "archive";
	leaderBoard: boolean;
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
	problemCount: number;
	creatorName: string;
}

interface ContestsListProps {
	contests: Contest[];
	totalPages: number;
	currentPage: number;
	status?: "Upcoming" | "Active" | "Finished";
}

export function ContestsList({
	contests,
	totalPages,
	currentPage,
	status,
}: ContestsListProps) {
	const router = useRouter();
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [contestToDelete, setContestToDelete] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isCloning, setIsCloning] = useState(false);

	const handleDelete = async () => {
		if (!contestToDelete) return;

		setIsDeleting(true);

		try {
			const result = await deleteContest(contestToDelete);

			if (result.success) {
				toast.success("Contest deleted successfully");
				router.refresh();
			} else {
				toast.error(result.error || "Failed to delete contest");
			}
		} catch (error) {
			console.error("Error deleting contest:", error);
			toast.error("An unexpected error occurred");
		} finally {
			setIsDeleting(false);
			setDeleteDialogOpen(false);
			setContestToDelete(null);
		}
	};

	const handleClone = async (contestId: string) => {
		setIsCloning(true);

		try {
			const result = await cloneContest(contestId);

			if (result.success) {
				toast.success("Contest cloned successfully");
				router.push(`/admin/contests/${result.contestId}`);
				router.refresh();
			} else {
				toast.error(result.error || "Failed to clone contest");
			}
		} catch (error) {
			console.error("Error cloning contest:", error);
			toast.error("An unexpected error occurred");
		} finally {
			setIsCloning(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Title</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Visibility</TableHead>
							<TableHead>Problems</TableHead>
							<TableHead>Start Time</TableHead>
							<TableHead>End Time</TableHead>
							<TableHead>Created By</TableHead>
							<TableHead className="w-[80px]"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{contests.length === 0 ? (
							<TableRow>
								<TableCell colSpan={8} className="h-24 text-center">
									No contests found
								</TableCell>
							</TableRow>
						) : (
							contests.map((contest) => (
								<TableRow key={contest.id}>
									<TableCell className="font-medium">
										<Link
											href={`/admin/contests/${contest.id}`}
											className="hover:underline"
										>
											{contest.title}
										</Link>
									</TableCell>
									<TableCell>
										<Badge
											className={cn(
												contest.status === "Upcoming" && "bg-blue-500",
												contest.status === "Active" && "bg-green-500",
												contest.status === "Finished" && "bg-gray-500"
											)}
										>
											{contest.status}
										</Badge>
									</TableCell>
									<TableCell>
										<Badge variant="outline">{contest.visibility}</Badge>
									</TableCell>
									<TableCell>{contest.problemCount}</TableCell>
									<TableCell>
										{format(new Date(contest.startTime), "MMM d, yyyy HH:mm")}
									</TableCell>
									<TableCell>
										{format(new Date(contest.endTime), "MMM d, yyyy HH:mm")}
									</TableCell>
									<TableCell>{contest.creatorName}</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="icon">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuLabel>Actions</DropdownMenuLabel>
												<DropdownMenuSeparator />
												<DropdownMenuItem asChild>
													<Link href={`/contests/${contest.id}`}>
														<Eye className="mr-2 h-4 w-4" />
														View
													</Link>
												</DropdownMenuItem>
												<DropdownMenuItem asChild>
													<Link href={`/admin/contests/${contest.id}/edit`}>
														<Edit className="mr-2 h-4 w-4" />
														Edit
													</Link>
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => handleClone(contest.id)}
													disabled={isCloning}
												>
													<Copy className="mr-2 h-4 w-4" />
													Clone
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													className="text-red-600"
													onClick={() => {
														setContestToDelete(contest.id);
														setDeleteDialogOpen(true);
													}}
												>
													<Trash2 className="mr-2 h-4 w-4" />
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{totalPages > 1 && (
				<Pagination className="mt-4">
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious
								href={`/admin/contests?page=${Math.max(1, currentPage - 1)}${
									status ? `&status=${status}` : ""
								}`}
								className={
									currentPage <= 1 ? "pointer-events-none opacity-50" : ""
								}
							/>
						</PaginationItem>

						{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
							// Show pages around the current page
							let pageNum;
							if (totalPages <= 5) {
								pageNum = i + 1;
							} else if (currentPage <= 3) {
								pageNum = i + 1;
							} else if (currentPage >= totalPages - 2) {
								pageNum = totalPages - 4 + i;
							} else {
								pageNum = currentPage - 2 + i;
							}

							return (
								<PaginationItem key={pageNum}>
									<PaginationLink
										href={`/admin/contests?page=${pageNum}${
											status ? `&status=${status}` : ""
										}`}
										isActive={pageNum === currentPage}
									>
										{pageNum}
									</PaginationLink>
								</PaginationItem>
							);
						})}

						<PaginationItem>
							<PaginationNext
								href={`/admin/contests?page=${Math.min(
									totalPages,
									currentPage + 1
								)}${status ? `&status=${status}` : ""}`}
								className={
									currentPage >= totalPages
										? "pointer-events-none opacity-50"
										: ""
								}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			)}

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Contest</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this contest? This action cannot
							be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteDialogOpen(false)}
							disabled={isDeleting}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={isDeleting}
						>
							{isDeleting ? "Deleting..." : "Delete"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
