import { AccessForm } from "./acess-form";
export default function ContestAccessPage({
	params,
}: {
	params: { contestId: string };
}) {
	// Server component that passes contestId as a prop to the client component
	return <AccessForm contestId={params.contestId} />;
}
