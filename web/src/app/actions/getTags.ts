"use server";

import { appDb } from "@/db/postgres";
import { tags } from "@/db/postgres/schema";

export async function getTags() {
	try {
		const allTags = await appDb
			.select({ id: tags.id, name: tags.name })
			.from(tags);
		return allTags;
	} catch (error) {
		console.error("Error fetching tags:", error);
		return [];
	}
}
