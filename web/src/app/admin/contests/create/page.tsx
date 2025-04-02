import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import CreateContestForm from "@/components/createContestForm";
export default function CreateContestPage() {
	return (
		<div className="container py-10">
			<h1 className="text-3xl font-bold mb-8">Create New Contest</h1>
			<Suspense fallback={<FormSkeleton />}>
				<CreateContestForm />
			</Suspense>
		</div>
	);
}

function FormSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-32 w-full" />
			<Skeleton className="h-64 w-full" />
			<Skeleton className="h-10 w-40" />
		</div>
	);
}
