import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RenderTable from "@/components/RenderTable";
import type { TableData, QueryOutputs } from "@/components/RenderTable";

const QueryResult = ({
	output,
	index,
}: {
	output: QueryOutputs[0];
	index: number;
}) => {
	return (
		<Card className="shadow-sm">
			<CardHeader className="py-3">
				{
					// not renderning query number
					/* <CardTitle className="text-base font-medium">
					Query {index + 1}
				</CardTitle> */
				}
			</CardHeader>
			<CardContent>
				{output.type === "table" ? (
					<RenderTable data={output.data as TableData} />
				) : (
					<Card className="bg-muted">
						<CardContent className="pt-6">
							<pre className="text-sm font-mono text-muted-foreground whitespace-pre-wrap break-words">
								{output.data as string}
							</pre>
						</CardContent>
					</Card>
				)}
			</CardContent>
		</Card>
	);
};

export default QueryResult;
