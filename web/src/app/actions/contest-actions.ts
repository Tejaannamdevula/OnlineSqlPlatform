"use server";

import { revalidatePath } from "next/cache";
import { appDb } from "@/db/postgres";
import {
	contests,
	contestProblems,
	users,
	contestRegistration,
	contestSubmission,
	contestLeaderboard,
	problems,
} from "@/db/postgres/schema";
import { verifySession } from "./session";
import { eq, and, sql, desc, asc } from "drizzle-orm";
import { format } from "date-fns";

// Get contests for admin
export async function getContests({
	page = 1,
	limit = 10,
	status,
}: {
	page?: number;
	limit?: number;
	status?: "Upcoming" | "Active" | "Finished";
}) {
	try {
		const session = await verifySession();
		if (!session?.isAuth || !session?.userId) {
			return {
				contests: [],
				totalPages: 0,
				currentPage: page,
				totalCount: 0,
			};
		}

		// Check if user is an admin
		const [user] = await appDb
			.select({ role: users.role })
			.from(users)
			.where(eq(users.id, session.userId));

		if (user?.role !== "admin") {
			return {
				contests: [],
				totalPages: 0,
				currentPage: page,
				totalCount: 0,
			};
		}

		const offset = (page - 1) * limit;

		// Build the query with filters
		let query = appDb
			.select({
				id: contests.id,
				title: contests.title,
				description: contests.description,
				startTime: contests.startTime,
				endTime: contests.endTime,
				status: contests.status,
				visibility: contests.visibility,
				leaderBoard: contests.leaderBoard,
				createdBy: contests.createdBy,
				createdAt: contests.createdAt,
				updatedAt: contests.updatedAt,
				problemCount: sql<number>`(
          SELECT COUNT(*) FROM ${contestProblems}
          WHERE ${contestProblems.contestId} = ${contests.id}
        )`,
				creatorName: sql<string>`(
          SELECT ${users.name} FROM ${users}
          WHERE ${users.id} = ${contests.createdBy}
        )`,
			})
			.from(contests);

		// Apply status filter if provided
		if (status) {
			query = query.where(eq(contests.status, status));
		}

		// Get contests with pagination
		const contestsData = await query
			.orderBy(
				desc(
					sql`CASE WHEN ${contests.status} = 'Active' THEN 0 WHEN ${contests.status} = 'Upcoming' THEN 1 ELSE 2 END`
				),
				desc(contests.startTime)
			)
			.limit(limit)
			.offset(offset);

		// Get total count for pagination
		const countQuery = appDb
			.select({ count: sql<number>`count(*)` })
			.from(contests);

		if (status) {
			countQuery.where(eq(contests.status, status));
		}

		const [countResult] = await countQuery;
		const totalCount = countResult?.count || 0;
		const totalPages = Math.ceil(totalCount / limit);

		return {
			contests: contestsData,
			totalPages,
			currentPage: page,
			totalCount,
		};
	} catch (error) {
		console.error("Error fetching contests:", error);
		return {
			contests: [],
			totalPages: 0,
			currentPage: page,
			totalCount: 0,
		};
	}
}

// Get contests for users
export async function getUserContests({
	page = 1,
	limit = 10,
	status,
	filter = "all",
	userId,
}: {
	page?: number;
	limit?: number;
	status?: "Upcoming" | "Active" | "Finished";
	filter?: "all" | "registered" | "recommended";
	userId?: string;
}) {
	try {
		const offset = (page - 1) * limit;

		// Build the query with filters
		let query = appDb
			.select({
				id: contests.id,
				title: contests.title,
				description: contests.description,
				startTime: contests.startTime,
				endTime: contests.endTime,
				status: contests.status,
				visibility: contests.visibility,
				leaderBoard: contests.leaderBoard,
				createdBy: contests.createdBy,
				createdAt: contests.createdAt,
				updatedAt: contests.updatedAt,
				registrationRequired: sql<boolean>`false`, // Default to false
				requiresPassword: sql<boolean>`false`, // Default to false
				problemCount: sql<number>`(
        SELECT COUNT(*) FROM ${contestProblems}
        WHERE ${contestProblems.contestId} = ${contests.id}
      )`,
				participantCount: sql<number>`(
        SELECT COUNT(*) FROM ${contestRegistration}
        WHERE ${contestRegistration.contestId} = ${contests.id}
      )`,
				isRegistered: userId
					? sql<boolean>`(
        SELECT COUNT(*) > 0 FROM ${contestRegistration}
        WHERE ${contestRegistration.contestId} = ${contests.id}
        AND ${contestRegistration.userId} = ${userId}
      )`
					: sql<boolean>`false`,
			})
			.from(contests);

		// Apply filters
		const conditions = [];

		// Only show public contests or private ones the user is registered for
		if (!userId) {
			conditions.push(eq(contests.visibility, "public"));
		} else {
			conditions.push(
				sql`(${contests.visibility} = 'public' OR (${contests.visibility} = 'private' AND EXISTS (
          SELECT 1 FROM ${contestRegistration}
          WHERE ${contestRegistration.contestId} = ${contests.id}
          AND ${contestRegistration.userId} = ${userId}
        )))`
			);
		}

		// Filter by status
		if (status) {
			conditions.push(eq(contests.status, status));
		}

		// Filter by registration
		if (filter === "registered" && userId) {
			conditions.push(
				sql`EXISTS (
          SELECT 1 FROM ${contestRegistration}
          WHERE ${contestRegistration.contestId} = ${contests.id}
          AND ${contestRegistration.userId} = ${userId}
        )`
			);
		} else if (filter === "recommended") {
			// For recommended, we could implement a more sophisticated algorithm
			// For now, just show contests with similar difficulty to what the user has solved before
			// This is a placeholder implementation
			conditions.push(eq(contests.visibility, "public"));
		}

		if (conditions.length > 0) {
			query = query.where(and(...conditions));
		}

		// Get featured contest (active contest with most participants)
		const featuredContestQuery = appDb
			.select({
				id: contests.id,
				title: contests.title,
				description: contests.description,
				startTime: contests.startTime,
				endTime: contests.endTime,
				status: contests.status,
				visibility: contests.visibility,
				participantCount: sql<number>`(
          SELECT COUNT(*) FROM ${contestRegistration}
          WHERE ${contestRegistration.contestId} = ${contests.id}
        )`,
			})
			.from(contests)
			.where(
				and(eq(contests.status, "Active"), eq(contests.visibility, "public"))
			)
			.orderBy(
				desc(sql<number>`(
        SELECT COUNT(*) FROM ${contestRegistration}
        WHERE ${contestRegistration.contestId} = ${contests.id}
      )`)
			)
			.limit(1);

		// Execute the queries
		const [featuredContest] = await featuredContestQuery;

		// Execute the main query with pagination
		const contestsData = await query
			.orderBy(
				desc(
					sql`CASE WHEN ${contests.status} = 'Active' THEN 0 WHEN ${contests.status} = 'Upcoming' THEN 1 ELSE 2 END`
				),
				desc(contests.startTime)
			)
			.limit(limit)
			.offset(offset);

		// Get total count for pagination
		const countQuery = appDb
			.select({ count: sql<number>`count(*)` })
			.from(contests);

		if (conditions.length > 0) {
			countQuery.where(and(...conditions));
		}

		const [countResult] = await countQuery;
		const totalCount = countResult?.count || 0;
		const totalPages = Math.ceil(totalCount / limit);

		return {
			contests: contestsData,
			totalPages,
			currentPage: page,
			totalCount,
			featuredContest,
		};
	} catch (error) {
		console.error("Error fetching contests:", error);
		throw error;
	}
}

// Get contest details
export async function getContestDetails(contestId: string, userId?: string) {
	try {
		// Get contest details
		const [contest] = await appDb
			.select({
				id: contests.id,
				title: contests.title,
				description: contests.description,
				startTime: contests.startTime,
				endTime: contests.endTime,
				status: contests.status,
				visibility: contests.visibility,
				leaderBoard: contests.leaderBoard,
				createdBy: contests.createdBy,
				createdAt: contests.createdAt,
				updatedAt: contests.updatedAt,
				rules: sql<string>`null`, // No rules field
				registrationRequired: sql<boolean>`false`, // Default to false
				requiresPassword: sql<boolean>`CASE WHEN ${contests.password} IS NOT NULL THEN true ELSE false END`,
				timeLimit: sql<number>`null`, // No time limit field
				problemCount: sql<number>`(
          SELECT COUNT(*) FROM ${contestProblems}
          WHERE ${contestProblems.contestId} = ${contests.id}
        )`,
				participantCount: sql<number>`(
          SELECT COUNT(*) FROM ${contestRegistration}
          WHERE ${contestRegistration.contestId} = ${contests.id}
        )`,
			})
			.from(contests)
			.where(eq(contests.id, contestId));

		if (!contest) {
			return { contest: null, isRegistered: false };
		}

		// Check if user is registered
		let isRegistered = false;
		if (userId) {
			const [registration] = await appDb
				.select()
				.from(contestRegistration)
				.where(
					and(
						eq(contestRegistration.contestId, contestId),
						eq(contestRegistration.userId, userId)
					)
				);

			isRegistered = !!registration;
		}

		return { contest, isRegistered };
	} catch (error) {
		console.error("Error fetching contest details:", error);
		return { contest: null, isRegistered: false };
	}
}

// Register for a contest
export async function registerForContest({
	contestId,
	password,
}: {
	contestId: string;
	password?: string;
}) {
	try {
		const session = await verifySession();
		if (!session?.isAuth || !session?.userId) {
			return {
				success: false,
				error: "You must be logged in to register for a contest",
			};
		}

		// Get contest details
		const [contest] = await appDb
			.select({
				id: contests.id,
				status: contests.status,
				registrationRequired: contests.registrationRequired,
				password: contests.password,
			})
			.from(contests)
			.where(eq(contests.id, contestId));

		if (!contest) {
			return { success: false, error: "Contest not found" };
		}

		// Check if contest is still open for registration
		if (contest.status === "Finished") {
			return { success: false, error: "Contest has already ended" };
		}

		// Check if registration is required
		if (!contest.registrationRequired) {
			return {
				success: false,
				error: "Registration is not required for this contest",
			};
		}

		// Check if password is required and correct
		if (contest.password && (!password || contest.password !== password)) {
			return { success: false, error: "Invalid password" };
		}

		// Replace with
		// Since registrationRequired doesn't exist in your schema, we'll assume all contests require registration
		// And since password doesn't exist, we'll skip password validation

		// Check if already registered
		const [existingRegistration] = await appDb
			.select()
			.from(contestRegistration)
			.where(
				and(
					eq(contestRegistration.contestId, contestId),
					eq(contestRegistration.userId, session.userId)
				)
			);

		if (existingRegistration) {
			return { success: true, message: "Already registered" };
		}

		// Register for the contest
		await appDb.insert(contestRegistration).values({
			contestId,
			userId: session.userId,
			registeredAt: new Date(),
		});

		revalidatePath(`/contests/${contestId}`);
		revalidatePath("/contests");

		return { success: true };
	} catch (error) {
		console.error("Error registering for contest:", error);
		return { success: false, error: "Failed to register for contest" };
	}
}

// Get contest problems
export async function getContestProblems(contestId: string) {
	try {
		const session = await verifySession();
		const userId = session?.userId;

		// Get contest details
		const [contest] = await appDb
			.select({
				status: contests.status,
				registrationRequired: contests.registrationRequired,
			})
			.from(contests)
			.where(eq(contests.id, contestId));

		if (!contest) {
			return { success: false, error: "Contest not found" };
		}

		// Check if user is registered if required
		let isRegistered = false;
		if (userId && contest.registrationRequired) {
			const [registration] = await appDb
				.select()
				.from(contestRegistration)
				.where(
					and(
						eq(contestRegistration.contestId, contestId),
						eq(contestRegistration.userId, userId)
					)
				);

			isRegistered = !!registration;
		}

		// For upcoming contests, only return problem count if not registered
		if (
			contest.status === "Upcoming" &&
			contest.registrationRequired &&
			!isRegistered
		) {
			const [count] = await appDb
				.select({ count: sql<number>`count(*)` })
				.from(contestProblems)
				.where(eq(contestProblems.contestId, contestId));

			return {
				success: true,
				problems: [],
				count: count?.count || 0,
			};
		}

		// Get problems with user's submission status
		const problemsData = await appDb
			.select({
				id: sql<string>`${contestProblems.problemId}`,
				title: sql<string>`(
          SELECT title FROM ${problems}
          WHERE ${problems.id} = ${contestProblems.problemId}
        )`,
				difficulty: sql<string>`(
          SELECT difficulty FROM ${problems}
          WHERE ${problems.id} = ${contestProblems.problemId}
        )`,
				points: contestProblems.points,
				order: contestProblems.order,
				solved: userId
					? sql<boolean>`EXISTS (
          SELECT 1 FROM ${contestSubmission}
          WHERE ${contestSubmission.contestId} = ${contestProblems.contestId}
          AND ${contestSubmission.problemId} = ${contestProblems.problemId}
          AND ${contestSubmission.userId} = ${userId}
          AND ${contestSubmission.isCorrect} = true
        )`
					: sql<boolean>`false`,
				attempted: userId
					? sql<boolean>`EXISTS (
          SELECT 1 FROM ${contestSubmission}
          WHERE ${contestSubmission.contestId} = ${contestProblems.contestId}
          AND ${contestSubmission.problemId} = ${contestProblems.problemId}
          AND ${contestSubmission.userId} = ${userId}
        )`
					: sql<boolean>`false`,
			})
			.from(contestProblems)
			.where(eq(contestProblems.contestId, contestId))
			.orderBy(contestProblems.order);

		return { success: true, problems: problemsData };
	} catch (error) {
		console.error("Error fetching contest problems:", error);
		return { success: false, error: "Failed to fetch contest problems" };
	}
}

// Get contest leaderboard
export async function getContestLeaderboard(contestId: string) {
	try {
		const session = await verifySession();
		const userId = session?.userId;

		// Get contest details
		const [contest] = await appDb
			.select({
				status: contests.status,
				leaderBoard: contests.leaderBoard,
			})
			.from(contests)
			.where(eq(contests.id, contestId));

		if (!contest) {
			return { success: false, error: "Contest not found" };
		}

		// Check if leaderboard is enabled
		if (!contest.leaderBoard) {
			return {
				success: false,
				error: "Leaderboard is not enabled for this contest",
			};
		}

		// For upcoming contests, return empty leaderboard
		if (contest.status === "Upcoming") {
			return { success: true, leaderboard: [] };
		}

		// Get leaderboard data
		const leaderboardData = await appDb
			.select({
				userId: contestLeaderboard.userId,
				rank: contestLeaderboard.rank,
				score: contestLeaderboard.totalScore,
				problemsSolved: contestLeaderboard.problemsSolved,
				totalProblems: sql<number>`(
          SELECT COUNT(*) FROM ${contestProblems}
          WHERE ${contestProblems.contestId} = ${contestId}
        )`,
				lastSubmission: contestLeaderboard.lastSolveTime,
				rankChange: sql<number>`0`, // Placeholder since rankChange isn't in the schema
				name: users.name,
				avatar: users.image,
			})
			.from(contestLeaderboard)
			.leftJoin(users, eq(contestLeaderboard.userId, users.id))
			.where(eq(contestLeaderboard.contestId, contestId))
			.orderBy(asc(contestLeaderboard.rank));

		// Format the leaderboard data
		const formattedLeaderboard = leaderboardData.map((entry) => ({
			...entry,
			isCurrentUser: entry.userId === userId,
			lastSubmission: entry.lastSubmission
				? format(new Date(entry.lastSubmission), "MMM d, HH:mm:ss")
				: "N/A",
		}));

		return { success: true, leaderboard: formattedLeaderboard };
	} catch (error) {
		console.error("Error fetching contest leaderboard:", error);
		return { success: false, error: "Failed to fetch contest leaderboard" };
	}
}

// Get participation status
export async function getParticipationStatus(contestId: string) {
	try {
		const session = await verifySession();
		if (!session?.isAuth || !session?.userId) {
			return {
				success: false,
				error: "You must be logged in to view participation status",
			};
		}

		// Get contest details
		const [contest] = await appDb
			.select({
				status: contests.status,
			})
			.from(contests)
			.where(eq(contests.id, contestId));

		if (!contest) {
			return { success: false, error: "Contest not found" };
		}

		// Get participation status
		const [status] = await appDb
			.select({
				startTime: contestRegistration.firstSubmissionTime,
				score: sql<number>`COALESCE((
          SELECT SUM(${contestProblems.points})
          FROM ${contestSubmission}
          JOIN ${contestProblems} ON ${contestSubmission.problemId} = ${contestProblems.problemId}
          AND ${contestSubmission.contestId} = ${contestProblems.contestId}
          WHERE ${contestSubmission.contestId} = ${contestId}
          AND ${contestSubmission.userId} = ${session.userId}
          AND ${contestSubmission.isCorrect} = true
        ), 0)`,
				rank: sql<number>`COALESCE((
          SELECT rank FROM ${contestLeaderboard}
          WHERE ${contestLeaderboard.contestId} = ${contestId}
          AND ${contestLeaderboard.userId} = ${session.userId}
        ), 0)`,
			})
			.from(contestRegistration)
			.where(
				and(
					eq(contestRegistration.contestId, contestId),
					eq(contestRegistration.userId, session.userId)
				)
			);

		return {
			success: true,
			status: status || { startTime: null, score: 0, rank: 0 },
		};
	} catch (error) {
		console.error("Error fetching participation status:", error);
		return { success: false, error: "Failed to fetch participation status" };
	}
}

// Create a contest
export async function createContest(data: {
	title: string;
	description: string;
	startTime: Date;
	endTime: Date;
	visibility: "public" | "private" | "archive";
	leaderBoard: boolean;
	registrationRequired?: boolean;
	password?: string;
	rules?: string;
	timeLimit?: number;
	problems: { id: string; points: number; order: number }[];
}) {
	try {
		const session = await verifySession();
		if (!session?.isAuth || !session?.userId) {
			return {
				success: false,
				error: "You must be logged in to create a contest",
			};
		}

		// Check if user is an admin
		const [user] = await appDb
			.select({ role: users.role })
			.from(users)
			.where(eq(users.id, session.userId));

		if (user?.role !== "admin") {
			return { success: false, error: "Only admins can create contests" };
		}

		// Validate start and end times
		if (data.startTime >= data.endTime) {
			return {
				success: false,
				error: "End time must be after start time",
			};
		}

		// Determine initial contest status based on start time
		const now = new Date();
		const status =
			data.startTime > now
				? "Upcoming"
				: data.endTime > now
				? "Active"
				: "Finished";

		// Use a transaction to ensure all operations succeed or fail together
		await appDb.transaction(async (tx) => {
			// Create the contest
			const [insertedContest] = await tx
				.insert(contests)
				.values({
					title: data.title,
					description: data.description,
					startTime: data.startTime,
					endTime: data.endTime,
					status,
					visibility: data.visibility,
					leaderBoard: data.leaderBoard,
					createdBy: session.userId,
					// Add additional fields
				})
				.returning({ id: contests.id });

			// Add problems to the contest
			if (data.problems.length > 0) {
				await tx.insert(contestProblems).values(
					data.problems.map((problem) => ({
						contestId: insertedContest.id,
						problemId: problem.id,
						points: problem.points,
						order: problem.order,
					}))
				);
			}
		});

		revalidatePath("/admin/contests");
		return { success: true };
	} catch (error) {
		console.error("Error creating contest:", error);
		return { success: false, error: "Failed to create contest" };
	}
}

// Clone a contest
export async function cloneContest(contestId: string) {
	try {
		const session = await verifySession();
		if (!session?.isAuth || !session?.userId) {
			return {
				success: false,
				error: "You must be logged in to clone a contest",
			};
		}

		// Get the original contest
		const { success, contest, error } = await getContestDetails(contestId);

		if (!success || !contest) {
			return { success: false, error: error || "Contest not found" };
		}

		// Use a transaction to ensure all operations succeed or fail together
		await appDb.transaction(async (tx) => {
			// Create the cloned contest
			const [newContest] = await tx
				.insert(contests)
				.values({
					title: `${contest.title} (Clone)`,
					description: contest.description,
					startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
					endTime: new Date(
						Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000
					), // 3 hours duration
					status: "Upcoming",
					visibility: contest.visibility,
					leaderBoard: contest.leaderBoard,
					createdBy: session.userId,
					rules: contest.rules,
					password: contest.password,
					registrationRequired: contest.registrationRequired,
					timeLimit: contest.timeLimit,
				})
				.returning({ id: contests.id });

			// Get problems from the original contest
			const problems = await appDb
				.select({
					problemId: contestProblems.problemId,
					points: contestProblems.points,
					order: contestProblems.order,
				})
				.from(contestProblems)
				.where(eq(contestProblems.contestId, contestId));

			// Clone the problems
			if (problems.length > 0) {
				await tx.insert(contestProblems).values(
					problems.map((problem) => ({
						contestId: newContest.id,
						problemId: problem.problemId,
						points: problem.points,
						order: problem.order,
					}))
				);
			}
		});

		revalidatePath("/admin/contests");
		return { success: true };
	} catch (error) {
		console.error("Error cloning contest:", error);
		return { success: false, error: "Failed to clone contest" };
	}
}

// Delete a contest
export async function deleteContest(contestId: string) {
	try {
		const session = await verifySession();
		if (!session?.isAuth || !session?.userId) {
			return {
				success: false,
				error: "You must be logged in to delete a contest",
			};
		}

		// Check if user is an admin or the contest creator
		const [contest] = await appDb
			.select({ createdBy: contests.createdBy })
			.from(contests)
			.where(eq(contests.id, contestId));

		if (!contest) {
			return { success: false, error: "Contest not found" };
		}

		const [user] = await appDb
			.select({ role: users.role })
			.from(users)
			.where(eq(users.id, session.userId));

		if (user?.role !== "admin" && contest.createdBy !== session.userId) {
			return {
				success: false,
				error: "You don't have permission to delete this contest",
			};
		}

		// Use a transaction to ensure all operations succeed or fail together
		await appDb.transaction(async (tx) => {
			// Delete contest problems first (due to foreign key constraints)
			await tx
				.delete(contestProblems)
				.where(eq(contestProblems.contestId, contestId));

			// Delete the contest
			await tx.delete(contests).where(eq(contests.id, contestId));
		});

		revalidatePath("/admin/contests");
		return { success: true };
	} catch (error) {
		console.error("Error deleting contest:", error);
		return { success: false, error: "Failed to delete contest" };
	}
}
