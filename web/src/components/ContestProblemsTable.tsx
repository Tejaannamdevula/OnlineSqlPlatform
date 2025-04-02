"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableHeader,
	TableRow,
	TableHead,
	TableBody,
	TableCell,
} from "@/components/ui/table";
import { CheckIcon, LockIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ContestProblem {
	problem: {
		id: string;
		title: string;
		difficulty: string;
		solved: number;
	};
	points: number;
}

interface ContestSubmission {
	userId: string;
	problemId: string;
	contestId: string;
	points: number;
}

interface ContestData {
	id: string;
	title: string;
	description: string;
	startTime: Date;
	endTime: Date;
	problems: ContestProblem[];
	contestSubmissions: ContestSubmission[];
}

export const ContestProblemsTable = ({ contest }: { contest: ContestData }) => {
	const now = new Date();
	const isActive =
		now >= new Date(contest.startTime) && now <= new Date(contest.endTime);

	return (
		<div className="flex flex-col">
			<div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Problem</TableHead>
							<TableHead>Difficulty</TableHead>
							<TableHead className="text-center">Points</TableHead>
							<TableHead className="text-center">Solved By</TableHead>
							<TableHead className="text-center">Status</TableHead>
							<TableHead className="text-right">Action</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{contest.problems.map(({ problem, points }) => (
							<TableRow key={problem.id}>
								<TableCell>
									<div className="font-medium">{problem.title}</div>
								</TableCell>
								<TableCell>
									<Badge
										className={
											problem.difficulty === "easy"
												? "bg-green-500"
												: problem.difficulty === "medium"
												? "bg-yellow-500"
												: "bg-red-500"
										}
									>
										{problem.difficulty}
									</Badge>
								</TableCell>
								<TableCell className="text-center">{points}</TableCell>
								<TableCell className="text-center">{problem.solved}</TableCell>
								<TableCell className="text-center">
									{contest.contestSubmissions.find(
										(submission) => submission.problemId === problem.id
									)?.points ? (
										<div className="flex justify-center">
											<CheckIcon className="h-5 w-5 text-green-500" />
										</div>
									) : (
										<div className="text-gray-400">Not solved</div>
									)}
								</TableCell>
								<TableCell className="text-right">
									{isActive ? (
										<Link href={`/contest/${contest.id}/problem/${problem.id}`}>
											<Button>Solve</Button>
										</Link>
									) : (
										<Button disabled variant="outline">
											<LockIcon className="h-4 w-4 mr-2" />
											Locked
										</Button>
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
};
