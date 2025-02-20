// import { userRole } from "@/db-drizzle/schema";

export type SessionPayload = {
  userId: string | number;
  email: string;
  role: string;
  expiresAt?: Date;
};
