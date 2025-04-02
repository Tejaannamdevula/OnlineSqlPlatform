"use client";
import { useEffect, useState } from "react";

// Format time as HH:MM:SS
function formatTime(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);

	return [
		hours.toString().padStart(2, "0"),
		minutes.toString().padStart(2, "0"),
		secs.toString().padStart(2, "0"),
	].join(":");
}

export const ContestClock = ({ endTime }: { endTime: Date }) => {
	// Start with null state to avoid hydration mismatch
	const [currentTimeLeft, setCurrentTimeLeft] = useState<number | null>(null);
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);

		// Calculate time left once mounted
		const timeLeft = Math.max(0, new Date(endTime).getTime() - Date.now());
		setCurrentTimeLeft(timeLeft);

		// Set up interval for updates
		const interval = setInterval(() => {
			const timeLeft = Math.max(0, new Date(endTime).getTime() - Date.now());
			setCurrentTimeLeft(timeLeft);

			// Clear interval when time reaches zero
			if (timeLeft <= 0) {
				clearInterval(interval);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [endTime]);

	// If not mounted yet, show placeholder with identical dimensions
	if (!isMounted || currentTimeLeft === null) {
		return (
			<div className="font-mono text-xl font-bold text-center opacity-0">
				00:00:00
			</div>
		);
	}

	// Convert milliseconds to seconds
	const secondsLeft = Math.floor(currentTimeLeft / 1000);

	return (
		<div className="font-mono text-xl font-bold text-center">
			{currentTimeLeft > 0 ? (
				formatTime(secondsLeft)
			) : (
				<span className="text-red-500">Contest Ended</span>
			)}
		</div>
	);
};
