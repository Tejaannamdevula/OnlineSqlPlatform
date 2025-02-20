export interface signUpFormData {
	name: string;
	email: string;
	password: string;
	role: "user" | "admin";
}

export interface ActionResponse {
	success: boolean;
	message: string;
	errors?: {
		[K in keyof signUpFormData]?: string[];
	};
}
