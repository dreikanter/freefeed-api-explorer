export interface FreeFeedInstance {
  name: string;
  url: string;
  description: string;
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  auth_required: boolean;
  scopes: string[];
  parameters: ApiParameter[];
}

export interface ApiParameter {
  name: string;
  location: 'path' | 'query' | 'body';
  type: string;
  required: boolean;
  description?: string;
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

export interface SavedToken {
  id: string;
  label: string;
  value: string;
  instance: FreeFeedInstance;
  createdAt: number;
}

export type ValidationResult =
  | { status: 'valid'; username: string; validatedAt: number }
  | { status: 'invalid'; validatedAt: number }
  | { status: 'error'; message: string; validatedAt: number };

export interface AppSettings {
  tokens: SavedToken[];
  activeTokenId: string;
  selectedInstance: FreeFeedInstance;
  requestHistory: ApiRequest[];
}
