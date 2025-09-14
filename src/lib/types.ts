export interface FreeFeedInstance {
	name: string;
	url: string;
	description: string;
}

export interface ApiEndpoint {
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	path: string;
	description: string;
	scope: string;
	parameters?: ApiParameter[];
}

export interface ApiParameter {
	name: string;
	type: 'string' | 'number' | 'boolean' | 'file';
	required: boolean;
	description?: string;
	example?: string;
}

export interface ApiRequest {
	id: string;
	timestamp: number;
	instance: FreeFeedInstance;
	endpoint: ApiEndpoint;
	parameters: Record<string, string>;
	response?: ApiResponse;
}

export interface ApiResponse {
	status: number;
	headers: Record<string, string>;
	body: string;
	timestamp: number;
}

export interface AppSettings {
	token: string;
	selectedInstance: FreeFeedInstance;
	requestHistory: ApiRequest[];
}