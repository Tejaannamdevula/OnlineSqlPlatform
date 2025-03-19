import {
	pgTable,
	uuid,
	text,
	varchar,
	timestamp,
	pgEnum,
	boolean,
	integer,
	primaryKey,
	doublePrecision,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";

// Enums
export const userRole = pgEnum("user_role", ["admin", "user"]);
export const difficulty = pgEnum("difficulty", ["easy", "medium", "hard"]);
export const submissionResult = pgEnum("submission_result", [
	"AC",
	"Rejected",
	"Pending",
]);
export const testCaseResult = pgEnum("test_case_result", [
	"AC",
	"Fail",
	"TLE",
	"CompilationError",
	"Pending",
]);
export const contestStatus = pgEnum("contest_status", [
	"Upcoming",
	"Active",
	"Finished",
]);
export const contestVisibility = pgEnum("contest_visibility", [
	"public",
	"private",
	"archive",
]);

// Tables
export const users = pgTable("users", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	password: varchar("password", { length: 255 }).notNull(),
	role: userRole("role").default("user").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.default(sql`now()`)
		.notNull(),
});

export const problems = pgTable("problems", {
	id: uuid("id").defaultRandom().primaryKey(),
	title: varchar("title", { length: 255 }).notNull(),
	description: text("description").notNull(),
	difficulty: difficulty("difficulty").default("medium"),
	hidden: boolean("hidden").default(false),
	sqlBoilerplate: text("sql_boilerplate").notNull(), // Default SQL boilerplate code
	sqlSolution: text("sql_solution").notNull(), // Solution in SQL
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at"),
});

export const tags = pgTable("tags", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: varchar("name", { length: 50 }).notNull().unique(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const problem_tags = pgTable(
	"problem_tags",
	{
		problemId: uuid("problem_id")
			.notNull()
			.references(() => problems.id, { onDelete: "cascade" }),
		tagId: uuid("tag_id")
			.notNull()
			.references(() => tags.id, { onDelete: "cascade" }),
	},
	(table) => [primaryKey({ columns: [table.problemId, table.tagId] })]
);

export const submissions = pgTable("submissions", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	problemId: uuid("problem_id")
		.notNull()
		.references(() => problems.id, { onDelete: "cascade" }),
	code: text("code").notNull(), // SQL code
	status: submissionResult("status").default("Pending"),
	memory: doublePrecision("memory"),
	time: doublePrecision("time"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const problem_test_cases = pgTable("problem_test_cases", {
	id: uuid("id").defaultRandom().primaryKey(),
	problemId: uuid("problem_id")
		.notNull()
		.references(() => problems.id, { onDelete: "cascade" }),
	inputData: text("input_data").notNull(), // SQL database state
	expectedOutput: text("expected_output").notNull(), // Expected SQL query result
	isHidden: boolean("is_hidden").default(false),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.default(sql`now()`)
		.notNull(),
});

export const submission_test_results = pgTable("submission_test_results", {
	id: uuid("id").defaultRandom().primaryKey(),
	submissionId: uuid("submission_id")
		.notNull()
		.references(() => submissions.id, { onDelete: "cascade" }),
	testCaseId: uuid("test_case_id")
		.notNull()
		.references(() => problem_test_cases.id, { onDelete: "cascade" }),
	actualOutput: text("actual_output").notNull(),
	result: testCaseResult("result").default("Pending"),
	memoryUsage: doublePrecision("memory_usage"),
	executionTime: doublePrecision("execution_time"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// export const contests = pgTable("contests", {
// 	id: uuid("id").defaultRandom().primaryKey(),
// 	title: varchar("title", { length: 255 }).notNull(),
// 	description: text("description").notNull(),
// 	startTime: timestamp("start_time").notNull(),
// 	endTime: timestamp("end_time").notNull(),
// 	status: contestStatus("status").default("Upcoming"),
// 	visibility: contestVisibility("visibility").default("public"),
// 	leaderBoard: boolean("leader_board").default(false),
// 	createdBy: uuid("created_by")
// 		.notNull()
// 		.references(() => users.id),
// 	createdAt: timestamp("created_at").defaultNow().notNull(),
// 	updatedAt: timestamp("updated_at")
// 		.default(sql`now()`)
// 		.notNull(),
// });

export const contests = pgTable("contests", {
	id: uuid("id").defaultRandom().primaryKey(),
	title: varchar("title", { length: 255 }).notNull(),
	description: text("description").notNull(),
	startTime: timestamp("start_time").notNull(),
	endTime: timestamp("end_time").notNull(),
	status: contestStatus("status").default("Upcoming"),
	visibility: contestVisibility("visibility").default("public"),
	leaderBoard: boolean("leader_board").default(false),
	createdBy: uuid("created_by")
		.notNull()
		.references(() => users.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.default(sql`now()`)
		.notNull(),
	// Add these new fields
	registrationRequired: boolean("registration_required").default(false),
	password: varchar("password", { length: 255 }),
	rules: text("rules"),
	timeLimit: integer("time_limit"),
});
export const contestProblems = pgTable(
	"contest_problems",
	{
		contestId: uuid("contest_id")
			.notNull()
			.references(() => contests.id, { onDelete: "cascade" }),
		problemId: uuid("problem_id")
			.notNull()
			.references(() => problems.id, { onDelete: "cascade" }),
		points: integer("points").default(100).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.default(sql`now()`)
			.notNull(),
	},
	(table) => {
		return [primaryKey({ columns: [table.contestId, table.problemId] })];
	}
);

export const contestRegistration = pgTable(
	"contest_registrations",
	{
		contestId: uuid("contest_id")
			.notNull()
			.references(() => contests.id, { onDelete: "cascade" }),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		registeredAt: timestamp("registered_at").defaultNow().notNull(),
	},
	(table) => [primaryKey({ columns: [table.contestId, table.userId] })]
);

export const contestSubmission = pgTable("contest_submissions", {
	id: uuid("id").defaultRandom().primaryKey(),
	contestId: uuid("contest_id")
		.notNull()
		.references(() => contests.id, { onDelete: "cascade" }),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	problemId: uuid("problem_id")
		.notNull()
		.references(() => problems.id, { onDelete: "cascade" }),
	submissionId: uuid("submission_id")
		.notNull()
		.references(() => submissions.id, { onDelete: "cascade" }),
	isCorrect: boolean("is_correct").default(false).notNull(),
	attemptNumber: integer("attempt_number").default(0),
	submittedAt: timestamp("submitted_at")
		.default(sql`now()`)
		.notNull(),
});

export const contestPoints = pgTable(
	"contest_points",
	{
		contestId: uuid("contest_id")
			.notNull()
			.references(() => contests.id, { onDelete: "cascade" }),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		problemId: uuid("problem_id")
			.notNull()
			.references(() => problems.id, { onDelete: "cascade" }),
		pointsEarned: integer("points_earned").default(0).notNull(),
		updatedAt: timestamp("updated_at")
			.default(sql`now()`)
			.notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.contestId, table.userId, table.problemId] }),
	]
);

export const contestLeaderboard = pgTable(
	"contest_leaderboard",
	{
		contestId: uuid("contest_id")
			.notNull()
			.references(() => contests.id, { onDelete: "cascade" }),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		totalScore: integer("total_score").default(0).notNull(),
		problemsSolved: integer("problems_solved").default(0).notNull(),
		totalAttempts: integer("total_attempts").default(0).notNull(),
		lastSolveTime: timestamp("last_solve_time"),
		lastUpdated: timestamp("last_updated")
			.default(sql`now()`)
			.notNull(),
	},
	(table) => [primaryKey({ columns: [table.contestId, table.userId] })]
);

export const userProblems = pgTable(
	"user_problems",
	{
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		problemId: uuid("problem_id")
			.notNull()
			.references(() => problems.id, { onDelete: "cascade" }),
		solved: boolean("solved").default(false).notNull(),
		bestSubmissionId: uuid("best_submission_id").references(
			() => submissions.id,
			{ onDelete: "set null" }
		),
		attemptsCount: integer("attempts_count").default(0).notNull(),
		lastAttemptAt: timestamp("last_attempt_at").defaultNow().notNull(),
	},
	(table) => [primaryKey({ columns: [table.userId, table.problemId] })]
);

// Types
export type NewUser = InferInsertModel<typeof users>;
export type NewProblem = InferInsertModel<typeof problems>;
export type NewTag = InferInsertModel<typeof tags>;
export type NewProblemTag = InferInsertModel<typeof problem_tags>;
export type NewSubmission = InferInsertModel<typeof submissions>;
export type NewProblemTestCase = InferInsertModel<typeof problem_test_cases>;
export type NewSubmissionTestResult = InferInsertModel<
	typeof submission_test_results
>;
export type NewContest = InferInsertModel<typeof contests>;
export type NewContestProblem = InferInsertModel<typeof contestProblems>;
export type NewContestRegistration = InferInsertModel<
	typeof contestRegistration
>;
export type NewContestSubmission = InferInsertModel<typeof contestSubmission>;
export type NewContestPoint = InferInsertModel<typeof contestPoints>;
export type NewContestLeaderboard = InferInsertModel<typeof contestLeaderboard>;
export type NewUserProblem = InferInsertModel<typeof userProblems>;
