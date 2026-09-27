import { ApiEndpoint, ApiProjectConfig } from '../types/api';

export const defaultProjectConfig: ApiProjectConfig = {
  title: 'Client Application API',
  version: '1.0.0',
  description: 'Official API reference documentation and OpenAPI 3.0 specification for client systems and third-party integrations.',
  baseUrls: {
    production: 'https://api.example.com',
    staging: 'https://staging-api.example.com',
  },
  authType: 'bearer',
  authHeader: 'Authorization: Bearer <token>',
  authDescription: 'Most endpoints require a valid Bearer JWT token in the Authorization header. Authenticate via POST /api/login to receive a token.',
};

export const defaultEndpoints: ApiEndpoint[] = [
  {
    id: 'post-login',
    path: '/api/login',
    method: 'POST',
    summary: 'Authenticate an existing user',
    description: 'Authenticate an existing user account using email and password credentials. On success, returns an authorization token for accessing protected endpoints.',
    category: 'Authentication',
    requiresAuth: false,
    headers: [
      {
        name: 'Content-Type',
        type: 'string',
        required: true,
        description: 'Specifies the media type of the request body.',
        example: 'application/json',
      },
      {
        name: 'Accept',
        type: 'string',
        required: false,
        description: 'Acceptable content types for the response.',
        example: 'application/json',
      },
    ],
    parameters: [
      {
        name: 'email',
        type: 'string',
        required: true,
        description: 'The registered user email address.',
        example: 'user@example.com',
      },
      {
        name: 'password',
        type: 'string',
        required: true,
        description: 'The user account password.',
        example: 'password',
      },
    ],
    requestBodyExample: {
      email: 'user@example.com',
      password: 'password',
    },
    responses: [
      {
        statusCode: 200,
        statusText: 'OK',
        description: 'Successful authentication. Returns session token.',
        body: {
          success: true,
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsZXggRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        },
      },
      {
        statusCode: 400,
        statusText: 'Bad Request',
        description: 'Missing required email or password fields in the payload.',
        body: {
          success: false,
          message: 'Email and password are required',
        },
      },
      {
        statusCode: 401,
        statusText: 'Unauthorized',
        description: 'Authentication failed due to incorrect email or password.',
        body: {
          success: false,
          message: 'Invalid credentials',
        },
      },
      {
        statusCode: 500,
        statusText: 'Internal Server Error',
        description: 'Unexpected server-side error occurred during authentication.',
        body: {
          success: false,
          message: 'An unexpected server error occurred',
        },
      },
    ],
  },
];
