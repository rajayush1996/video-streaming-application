# User-Side API Documentation

## Authentication APIs

### Login
```http
POST /api/v1/auth/login
```
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "user"
    },
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### Register
```http
POST /api/v1/auth/register
```
**Request Body:**
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "yourpassword",
  "confirmPassword": "yourpassword"
}
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "user"
    },
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### Refresh Token
```http
POST /api/v1/auth/refresh-token
```
**Request Body:**
```json
{
  "refreshToken": "your_refresh_token"
}
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "token": "new_jwt_token",
    "refreshToken": "new_refresh_token"
  }
}
```

### Logout
```http
POST /api/v1/auth/logout
```
**Headers:**
```
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "refreshToken": "your_refresh_token"
}
```
**Response:**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

## Profile APIs

### Get User Profile
```http
GET /api/v1/users/profile
```
**Headers:**
```
Authorization: Bearer <token>
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "profilePicture": "url_to_picture",
    "bio": "User bio",
    "isCreator": false
  }
}
```

### Update Profile
```http
PATCH /api/v1/users/profile
```
**Headers:**
```
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "name": "Updated Name",
  "bio": "Updated bio",
  "profilePicture": "new_picture_url"
}
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "user_id",
    "name": "Updated Name",
    "email": "user@example.com",
    "profilePicture": "new_picture_url",
    "bio": "Updated bio",
    "isCreator": false
  }
}
```

## Creator Request APIs

### Submit Creator Request
```http
POST /api/v1/creator-requests
```
**Headers:**
```
Authorization: Bearer <token>
```
**Request Body:**
```json
{
  "reason": "I want to share my content",
  "portfolio": "https://my-portfolio.com"
}
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "request_id",
    "status": "pending",
    "reason": "I want to share my content",
    "portfolio": "https://my-portfolio.com",
    "createdAt": "2024-03-20T10:00:00Z"
  }
}
```

### Get My Creator Request
```http
GET /api/v1/creator-requests/user/me
```
**Headers:**
```
Authorization: Bearer <token>
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "request_id",
    "status": "pending",
    "reason": "I want to share my content",
    "portfolio": "https://my-portfolio.com",
    "adminNote": null,
    "createdAt": "2024-03-20T10:00:00Z"
  }
}
```

## Media APIs

### Get All Media
```http
GET /api/v1/media
```
**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `category`: Filter by category

**Response:**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "media_id",
        "title": "Video Title",
        "description": "Video Description",
        "thumbnail": "thumbnail_url",
        "views": 1000,
        "creator": {
          "id": "creator_id",
          "name": "Creator Name"
        },
        "category": "category_name",
        "createdAt": "2024-03-20T10:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

### Get Media by ID
```http
GET /api/v1/media/{id}
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "media_id",
    "title": "Video Title",
    "description": "Video Description",
    "videoUrl": "video_url",
    "thumbnail": "thumbnail_url",
    "views": 1000,
    "creator": {
      "id": "creator_id",
      "name": "Creator Name",
      "profilePicture": "profile_picture_url"
    },
    "category": "category_name",
    "tags": ["tag1", "tag2"],
    "createdAt": "2024-03-20T10:00:00Z"
  }
}
```

### Increment View Count
```http
PUT /api/v1/media/{id}/view
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "views": 1001
  }
}
```

## Blog APIs

### Get All Blogs
```http
GET /api/v1/blogs
```
**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response:**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "blog_id",
        "title": "Blog Title",
        "content": "Blog Content",
        "author": {
          "id": "author_id",
          "name": "Author Name"
        },
        "createdAt": "2024-03-20T10:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 10
  }
}
```

### Get Blog by ID
```http
GET /api/v1/blogs/{id}
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "blog_id",
    "title": "Blog Title",
    "content": "Blog Content",
    "author": {
      "id": "author_id",
      "name": "Author Name",
      "profilePicture": "profile_picture_url"
    },
    "tags": ["tag1", "tag2"],
    "createdAt": "2024-03-20T10:00:00Z",
    "updatedAt": "2024-03-20T11:00:00Z"
  }
}
```

## Notification APIs

### Get Notifications
```http
GET /api/v1/notifications
```
**Headers:**
```
Authorization: Bearer <token>
```
**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response:**
```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "id": "notification_id",
        "type": "CREATOR_REQUEST_APPROVED",
        "message": "Your creator request has been approved",
        "isRead": false,
        "createdAt": "2024-03-20T10:00:00Z"
      }
    ],
    "total": 20,
    "page": 1,
    "limit": 10
  }
}
```

### Get Unread Count
```http
GET /api/v1/notifications/unread-count
```
**Headers:**
```
Authorization: Bearer <token>
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "count": 5
  }
}
```

### Mark as Read
```http
PATCH /api/v1/notifications/{id}/mark-read
```
**Headers:**
```
Authorization: Bearer <token>
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "notification_id",
    "isRead": true
  }
}
```

### Delete Notification
```http
DELETE /api/v1/notifications/{id}
```
**Headers:**
```
Authorization: Bearer <token>
```
**Response:**
```json
{
  "status": "success",
  "message": "Notification deleted successfully"
}
```

## Error Responses

All APIs may return the following error responses:

### 400 Bad Request
```json
{
  "status": "error",
  "message": "Invalid input data",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "status": "error",
  "message": "Unauthorized access"
}
```

### 403 Forbidden
```json
{
  "status": "error",
  "message": "You don't have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "status": "error",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "Internal server error"
}
``` 