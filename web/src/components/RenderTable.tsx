export type TableData = {
	headers: string[];
	rows: (string | number)[][];
} | null;
export type QueryOutput = {
	type: "table" | "message";
	data: TableData | string;
};

export type QueryOutputs = QueryOutput[];
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

function RenderTable({ data }: { data: TableData }) {
	if (!data) return null;

	return (
		<div className="space-y-8 p-4">
			<div className="rounded-md border bg-white shadow-sm overflow-hidden">
				<div className="overflow-auto max-h-[calc(100vh-300px)]">
					<Table>
						<TableHeader className="sticky top-0 bg-white z-10">
							<TableRow>
								{data.headers.map((header, index) => (
									<TableHead
										key={`header-${index}`}
										className="font-bold text-black bg-gray-100 px-6 py-4"
									>
										{header}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{data.rows.map((row, rowIndex) => (
								<TableRow
									key={`row-${rowIndex}`}
									// className="hover:bg-gray-50 transition-colors"
								>
									{row.map((cell, cellIndex) => (
										<TableCell
											key={`cell-${rowIndex}-${cellIndex}`}
											className="px-6 py-4 border-b"
										>
											{cell}
										</TableCell>
									))}
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	);
}

export default RenderTable;
