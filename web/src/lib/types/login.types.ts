interface loginFormData {
	emial: string;
	password: string;
}

export interface ActionResponse {
	success: boolean;
	message: string;
	errors?: {
		[K in keyof loginFormData]?: string[];
	};
}
