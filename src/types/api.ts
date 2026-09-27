export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface HeaderParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: string;
}

export interface BodyParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: string;
}

export interface ApiResponseExample {
  statusCode: number;
  statusText: string;
  description: string;
  body: Record<string, unknown> | string;
}

export interface ApiEndpoint {
  id: string;
  path: string;
  method: HttpMethod;
  summary: string;
  description: string;
  category: string;
  requiresAuth: boolean;
  headers: HeaderParameter[];
  parameters: BodyParameter[];
  requestBodyExample?: Record<string, unknown>;
  responses: ApiResponseExample[];
}

export interface ApiProjectConfig {
  title: string;
  version: string;
  description: string;
  baseUrls: {
    production: string;
    staging: string;
  };
  authType: 'bearer' | 'apiKey' | 'none';
  authHeader: string;
  authDescription: string;
}
