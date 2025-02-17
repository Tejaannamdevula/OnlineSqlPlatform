// "use client";

// import Markdown from "react-markdown";
// import remarkGfm from "remark-gfm";

// export function ProblemStatement({ description }: { description: string }) {
// 	return (
// 		<div className="prose lg:prose-xl max-w-none">
// 			<Markdown
// 				remarkPlugins={[remarkGfm]}
// 				components={{
// 					table: ({ children }) => (
// 						<div className="overflow-x-auto my-4">
// 							<table className="min-w-full border-collapse border border-gray-300">
// 								{children}
// 							</table>
// 						</div>
// 					),
// 					thead: ({ children }) => (
// 						<thead className="bg-gray-50">{children}</thead>
// 					),
// 					th: ({ children }) => (
// 						<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 border border-gray-300">
// 							{children}
// 						</th>
// 					),
// 					td: ({ children }) => (
// 						<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-300">
// 							{children}
// 						</td>
// 					),
// 					tr: ({ children }) => <tr className="even:bg-gray-50">{children}</tr>,
// 				}}
// 			>
// 				{description}
// 			</Markdown>
// 		</div>
// 	);
// }
import Markdown from "react-markdown";

import remarkGfm from "remark-gfm";

export function ProblemStatement({ description }: { description: string }) {
	return (
		<div className="prose prose-slate lg:prose-xl dark:prose-invert max-w-none">
			<Markdown
				remarkPlugins={[remarkGfm]}
				components={{
					table: ({ children }) => (
						<div className="overflow-x-auto my-8">
							<table className="border-collapse w-full">{children}</table>
						</div>
					),

					thead: ({ children }) => (
						<thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>
					),

					th: ({ children }) => (
						<th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left">
							{children}
						</th>
					),

					td: ({ children }) => (
						<td className="border border-gray-200 dark:border-gray-700 px-4 py-2 font-mono">
							{children}
						</td>
					),

					code: ({ children }) => (
						<code className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 font-mono text-sm">
							{children}
						</code>
					),
				}}
			>
				{description}
			</Markdown>
		</div>
	);
}
