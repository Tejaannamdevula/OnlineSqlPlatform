"use server";

import { appDb } from "@/db/postgres";
import { problems } from "@/db/postgres/schema";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export default async function ProblemsPage() {
	const data = await appDb.select().from(problems);

	return (
		<div className="min-h-screen bg-[#0a0d16]">
			<div className="container mx-auto px-4 py-8">
				<div className="rounded-lg overflow-hidden">
					<Table>
						<TableHeader>
							<TableRow className="border-b border-blue-900">
								<TableHead className="text-center text-3xl font-semibold text-blue-400 bg-[#0f1524] py-4">
									Problems
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody className="bg-[#0a0d16]">
							{data.length > 0 ? (
								data.map((problem) => (
									<TableRow
										key={problem.id}
										className="border-b border-blue-900/30 hover:bg-[#0f1524] transition-colors"
									>
										<TableCell className="p-0 text-xl text-center">
											<Link
												href={`/problems/${problem.id}`}
												className="block px-4 py-3 text-gray-300 hover:text-blue-400 transition-colors"
											>
												{problem.title}
											</Link>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell className="text-center py-4 text-gray-400">
										No problems found.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	);
}
