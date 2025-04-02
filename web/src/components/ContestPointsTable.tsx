"use client";
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
} from "@/components/ui/table";
import { Trophy, Medal } from "lucide-react";
import { useEffect, useState } from "react";

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
	function getClassName(contestPoint: ContestPointData) {
		return currentUser?.id === contestPoint.user.id
			? "font-bold text-green-600 dark:text-green-500"
			: "";
	}

	function getRankIcon(rank: number) {
		switch (rank) {
			case 1:
				return <Trophy className="h-5 w-5 text-yellow-500" />;
			case 2:
				return <Medal className="h-5 w-5 text-gray-400" />;
			case 3:
				return <Medal className="h-5 w-5 text-amber-700" />;
			default:
				return null;
		}
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="w-16">Rank</TableHead>
					<TableHead>User</TableHead>
					<TableHead className="text-right">Points</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{contestPoints.map((contestPoint) => (
					<TableRow key={contestPoint.user.id}>
						<TableCell className={getClassName(contestPoint)}>
							<div className="flex items-center gap-2">
								{getRankIcon(contestPoint.rank)}
								<span>{contestPoint.rank}</span>
							</div>
						</TableCell>
						<TableCell className={getClassName(contestPoint)}>
							{contestPoint.user.name}
						</TableCell>
						<TableCell className={`text-right ${getClassName(contestPoint)}`}>
							{contestPoint.points}
						</TableCell>
					</TableRow>
				))}
				{contestPoints.length === 0 && (
					<TableRow>
						<TableCell colSpan={3} className="text-center py-6 text-gray-500">
							No participants yet
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
}
