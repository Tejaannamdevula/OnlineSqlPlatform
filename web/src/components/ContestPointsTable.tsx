"use client";
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContestPointData {
	rank: number;
	points: number;
	user: {
		id: string;
		name: string;
	};
}

interface SessionUser {
	id: string;
	name: string;
}

export function ContestPointsTable({
	contestPoints,
	currentUser,
}: {
	contestPoints: ContestPointData[];
	currentUser?: SessionUser;
}) {
	function getInitials(name: string) {
		return name
			.split(" ")
			.map((part) => part[0])
			.join("")
			.toUpperCase()
			.substring(0, 2);
	}

	function getRankBadge(rank: number) {
		if (rank === 1) {
			return (
				<div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
					<Trophy className="h-4 w-4 text-amber-600" />
				</div>
			);
		}
		if (rank === 2) {
			return (
				<div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
					<Medal className="h-4 w-4 text-gray-500" />
				</div>
			);
		}
		if (rank === 3) {
			return (
				<div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
					<Award className="h-4 w-4 text-orange-500" />
				</div>
			);
		}

		return (
			<div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
				<span className="text-sm font-medium">{rank}</span>
			</div>
		);
	}

	function getPointsColor(points: number, rank: number) {
		if (rank === 1) return "text-amber-600";
		if (rank === 2) return "text-gray-500";
		if (rank === 3) return "text-orange-500";
		return "";
	}

	return (
		<div className="overflow-hidden rounded-lg border border-border">
			<Table>
				<TableHeader>
					<TableRow className="bg-muted/50 hover:bg-muted/50">
						<TableHead className="w-[80px] text-sm font-medium">Rank</TableHead>
						<TableHead className="text-sm font-medium">Participant</TableHead>
						<TableHead className="text-right text-sm font-medium w-[100px]">
							Points
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{contestPoints.map((contestPoint) => {
						const isCurrentUser = currentUser?.id === contestPoint.user.id;

						return (
							<TableRow
								key={contestPoint.user.id}
								className={cn(
									isCurrentUser && "bg-primary/5",
									contestPoint.rank <= 3 && "font-medium"
								)}
							>
								<TableCell className="py-4">
									<div className="flex items-center justify-center">
										{getRankBadge(contestPoint.rank)}
									</div>
								</TableCell>
								<TableCell className="py-4">
									<div className="flex items-center gap-3">
										<Avatar
											className={cn(
												"h-9 w-9 border",
												isCurrentUser ? "border-primary" : "border-gray-200"
											)}
										>
											<AvatarFallback
												className={cn(
													"text-xs",
													isCurrentUser
														? "bg-primary/15 text-primary"
														: "bg-muted text-muted-foreground"
												)}
											>
												{getInitials(contestPoint.user.name)}
											</AvatarFallback>
										</Avatar>
										<div>
											<div
												className={cn(
													contestPoint.rank <= 3 && "font-medium",
													isCurrentUser && "text-primary"
												)}
											>
												{contestPoint.user.name}
												{isCurrentUser && (
													<span className="ml-2 text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded-sm">
														you
													</span>
												)}
											</div>
										</div>
									</div>
								</TableCell>
								<TableCell className="py-4 text-right">
									<span
										className={cn(
											"text-base font-semibold",
											getPointsColor(contestPoint.points, contestPoint.rank)
										)}
									>
										{contestPoint.points}
									</span>
								</TableCell>
							</TableRow>
						);
					})}
					{contestPoints.length === 0 && (
						<TableRow>
							<TableCell
								colSpan={3}
								className="py-12 text-center text-muted-foreground"
							>
								<div className="flex flex-col items-center justify-center">
									<Trophy className="h-8 w-8 mb-2 text-muted-foreground/50" />
									<p>No participants yet</p>
								</div>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
