# Client Application API Documentation

A developer-friendly guide to integrating with the Client Application API.

---

## Table of Contents

- [Overview](#overview)
- [Base URLs](#base-urls)
- [Authentication](#authentication)
- [Status & Error Codes](#status--error-codes)
- [API Endpoints](#api-endpoints)
  - [POST /api/login](#post-apilogin)
- [OpenAPI Specification](#openapi-specification)

---

## Overview

All requests and responses use standard `application/json` formatting unless otherwise specified. Dates and timestamps follow ISO 8601 strings.

### Base URLs

| Environment | Base URL |
| :--- | :--- |
| **Production** | `https://api.example.com` |
| **Staging** | `https://staging-api.example.com` |

---

## Authentication

Protected endpoints require a Bearer token passed in the standard HTTP `Authorization` header:

```http
Authorization: Bearer <your_jwt_token>
```

Tokens are obtained by authenticating against the `POST /api/login` endpoint. Tokens expire after 24 hours.

---

## Status & Error Codes

The API uses conventional HTTP response codes to indicate success or failure:

| Status Code | Meaning | Description |
| :--- | :--- | :--- |
| `200 OK` | Success | The request succeeded and payload is returned. |
| `400 Bad Request` | Client Error | Malformed request syntax or missing required parameters. |
| `401 Unauthorized` | Auth Error | Invalid or expired credentials/token. |
| `403 Forbidden` | Access Denied | Authenticated user lacks permission for the resource. |
| `404 Not Found` | Resource Missing | The requested resource or endpoint was not found. |
| `500 Server Error` | Internal Error | An unexpected server error occurred. |

All error responses return a standardized JSON structure:

```json
{
  "success": false,
  "message": "Human-readable description of what went wrong"
}
```

---

## API Endpoints

### POST /api/login

Authenticate an existing user account using their email and password credentials.

#### Endpoint Details

- **Method**: `POST`
- **Path**: `/api/login`
- **Authentication**: None (Public)
- **Content-Type**: `application/json`

#### Request Headers

| Header | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `Content-Type` | `string` | **Yes** | Must be set to `application/json` |
| `Accept` | `string` | No | Recommended `application/json` |

#### Request Body Parameters

| Parameter | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `email` | `string` | **Yes** | Registered account email | `"user@example.com"` |
| `password` | `string` | **Yes** | Account password | `"password"` |

#### Request Example

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

#### Code Examples

##### cURL
```bash
curl -X POST https://api.example.com/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'
```

##### JavaScript (Fetch)
```javascript
const response = await fetch('https://api.example.com/api/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password'
  })
});

const data = await response.json();
console.log(data);
```

##### Python (requests)
```python
import requests

url = "https://api.example.com/api/login"
payload = {
    "email": "user@example.com",
    "password": "password"
}
headers = {
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)
print(response.status_code, response.json())
```

#### Response Examples

##### Success Response (`200 OK`)
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

##### Error Response (`401 Unauthorized`)
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

##### Error Response (`400 Bad Request`)
```json
{
  "success": false,
  "message": "Email and password are required"
}
```

---

## OpenAPI Specification

The complete OpenAPI 3.0.3 specification is available in [`openapi.yaml`](./openapi.yaml). You can import it into Swagger UI, Postman, Insomnia, or Redoc for automated client generation and testing.
