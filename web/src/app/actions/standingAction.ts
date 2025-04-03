"use server";

import { appDb } from "@/db/postgres";
import { contests, contestPoints, users } from "@/db/postgres/schema";
import { eq, sql } from "drizzle-orm";

// Get all contests that have leaderboards enabled
export async function getContestsWithLeaderboard() {
	try {
		const allContests = await appDb
			.select({
				id: contests.id,
				title: contests.title,
				startTime: contests.startTime,
				endTime: contests.endTime,
			})
			.from(contests)
			.where(eq(contests.leaderBoard, true))
			.orderBy(contests.startTime);

		// Add status to each contest
		const now = new Date();
		const contestsWithStatus = allContests.map((contest) => {
			const startTime = new Date(contest.startTime);
			const endTime = new Date(contest.endTime);

			let status: "upcoming" | "active" | "finished";
			if (now < startTime) {
				status = "upcoming";
			} else if (now >= startTime && now <= endTime) {
				status = "active";
			} else {
				status = "finished";
			}

			return {
				...contest,
				status,
			};
		});

		return {
			success: true,
			data: contestsWithStatus,
		};
	} catch (error) {
		console.error("Error fetching contests with leaderboard:", error);
		return {
			success: false,
			error: "Failed to fetch contests with leaderboard",
		};
	}
}

// Get contest standings for a specific contest
export async function getContestStandings(contestId: string) {
	try {
		// Check if contest exists and has leaderboard enabled
		const contestResult = await appDb
			.select({
				id: contests.id,
				leaderBoard: contests.leaderBoard,
			})
			.from(contests)
			.where(eq(contests.id, contestId))
			.limit(1);

		if (!contestResult.length) {
			return { success: false, error: "Contest not found" };
		}

		if (!contestResult[0].leaderBoard) {
			return {
				success: false,
				error: "Leaderboard is disabled for this contest",
			};
		}

		// Get leaderboard data with rank calculation using proper table references
		const leaderboardData = await appDb.execute(sql`
      WITH RankedPoints AS (
        SELECT
          cp."user_id",
          cp."points_earned",
          RANK() OVER (ORDER BY cp."points_earned" DESC) as rank
        FROM "contest_points" cp
        WHERE cp."contest_id" = ${contestId}
      )
      SELECT
        r.rank,
        r."points_earned" as points,
        u.id as "user.id",
        u.name as "user.name"
      FROM RankedPoints r
      JOIN "users" u ON r."user_id" = u.id
      ORDER BY r.rank ASC
    `);

		// Transform the raw data to match the expected ContestPointData format
		const formattedData = leaderboardData.rows.map((row: any) => ({
			rank: Number(row.rank),
			points: Number(row.points),
			user: {
				id: row["user.id"],
				name: row["user.name"],
			},
		}));

		return {
			success: true,
			data: formattedData,
		};
	} catch (error) {
		console.error("Error fetching contest standings:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to fetch standings",
		};
	}
}
