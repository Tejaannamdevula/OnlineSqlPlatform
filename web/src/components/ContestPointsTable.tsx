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

	return (
		<div className="overflow-hidden rounded-md border border-border">
			<Table>
				<TableHeader>
					<TableRow className="bg-muted/50 hover:bg-muted/50">
						<TableHead className="w-16 text-xs font-medium text-muted-foreground">
							Rank
						</TableHead>
						<TableHead className="text-xs font-medium text-muted-foreground">
							User
						</TableHead>
						<TableHead className="text-right text-xs font-medium text-muted-foreground">
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
								className={isCurrentUser ? "bg-primary/5" : ""}
							>
								<TableCell className="py-3 text-sm">
									{contestPoint.rank}
								</TableCell>
								<TableCell className="py-3">
									<div className="flex items-center gap-3">
										<Avatar className="h-6 w-6">
											<AvatarFallback className="text-xs bg-muted">
												{getInitials(contestPoint.user.name)}
											</AvatarFallback>
										</Avatar>
										<span className={isCurrentUser ? "font-medium" : ""}>
											{contestPoint.user.name}
										</span>
										{isCurrentUser && (
											<span className="text-xs text-muted-foreground ml-2">
												(you)
											</span>
										)}
									</div>
								</TableCell>
								<TableCell className="py-3 text-right font-medium text-sm">
									{contestPoint.points}
								</TableCell>
							</TableRow>
						);
					})}
					{contestPoints.length === 0 && (
						<TableRow>
							<TableCell
								colSpan={3}
								className="py-8 text-center text-muted-foreground"
							>
								No participants yet
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
