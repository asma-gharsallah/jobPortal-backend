# Job Portal API Documentation

## Base URL

```
http://localhost:3001/api
```

## Authentication Endpoints

### Register User

```http
POST /auth/register

Request Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "message": "User registered successfully",
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "profile": {}
  }
}
```

### Login

```http
POST /auth/login

Request Body:
{
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "message": "Logged in successfully",
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Get Current User

```http
GET /auth/me
Headers: Authorization: Bearer jwt_token

Response:
{
  "id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "profile": {}
}
```

## Jobs Endpoints

### Get All Jobs

```http
GET /jobs
Query Parameters:
- page (default: 1)
- limit (default: 10)
- search (optional)
- category (optional)
- location (optional)
- type (optional)
- minSalary (optional)
- maxSalary (optional)

Response:
{
  "jobs": [],
  "currentPage": 1,
  "totalPages": 5,
  "total": 48
}
```

### Get Job by ID

```http
GET /jobs/:id

Response:
{
  "id": "job_id",
  "title": "Software Engineer",
  "description": "...",
  "requirements": [],
  "skills": []
}
```

### Create Job

```http
POST /jobs
Headers: Authorization: Bearer jwt_token

Request Body:
{
  "title": "Software Engineer",
  "location": "New York",
  "type": "Full-time",
  "category": "Software Development",
  "description": "...",
  "requirements": [],
  "responsibilities": [],
  "skills": [],
  "salary": {
    "min": 80000,
    "max": 120000
  },
  "experience": {
    "min": 2,
    "max": 5
  }
}

Response:
{
  "message": "Job created successfully",
  "job": {}
}
```

### Apply for Job

```http
POST /jobs/:id/apply
Headers: Authorization: Bearer jwt_token

Request Body:
{
  "coverLetter": "..."
}

Response:
{
  "message": "Application submitted successfully",
  "application": {}
}
```

## Applications Endpoints

### Get User Applications

```http
GET /applications/my-applications
Headers: Authorization: Bearer jwt_token
Query Parameters:
- page (default: 1)
- limit (default: 10)

Response:
{
  "applications": [],
  "currentPage": 1,
  "totalPages": 3,
  "total": 25
}
```

### Get Job Applications (for employers)

```http
GET /applications/jobs/:jobId/applications
Headers: Authorization: Bearer jwt_token
Query Parameters:
- page (default: 1)
- limit (default: 10)
- status (optional)

Response:
{
  "applications": [],
  "currentPage": 1,
  "totalPages": 2,
  "total": 15
}
```

### Update Application Status

```http
PATCH /applications/:id/status
Headers: Authorization: Bearer jwt_token

Request Body:
{
  "status": "under_review" // pending, under_review, accepted, rejected
}

Response:
{
  "message": "Application status updated successfully",
  "application": {}
}
```

### Withdraw Application

```http
POST /applications/my-applications/:id/withdraw
Headers: Authorization: Bearer jwt_token

Response:
{
  "message": "Application withdrawn successfully",
  "application": {}
}
```

## Error Responses

### 400 Bad Request

```json
{
  "message": "Error message here",
  "errors": [] // Validation errors if any
}
```

### 401 Unauthorized

```json
{
  "message": "Please authenticate."
}
```

### 403 Forbidden

```json
{
  "message": "Access denied."
}
```

### 404 Not Found

```json
{
  "message": "Resource not found"
}
```

### 500 Server Error

```json
{
  "message": "Internal server error",
  "error": "Detailed error in development mode"
}
```
