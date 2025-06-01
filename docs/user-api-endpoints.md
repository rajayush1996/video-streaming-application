# User API Endpoints Documentation

## Authentication

### Sign Up
```http
POST /api/v1/user/auth/signup
```
**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "user"
}
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "usr-123456",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "createdAt": "2024-03-20T10:00:00Z"
    },
    "tokens": {
      "access": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expires": "2024-03-21T10:00:00Z"
      },
      "refresh": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expires": "2024-04-19T10:00:00Z"
      }
    }
  }
}
```

### Sign In
```http
POST /api/v1/user/auth/signin
```
**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "usr-123456",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "tokens": {
      "access": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expires": "2024-03-21T10:00:00Z"
      },
      "refresh": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expires": "2024-04-19T10:00:00Z"
      }
    }
  }
}
```

### Refresh Token
```http
POST /api/v1/user/auth/refresh-tokens
```
**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "access": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires": "2024-03-21T10:00:00Z"
    },
    "refresh": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires": "2024-04-19T10:00:00Z"
    }
  }
}
```

## Profile Management

### Get Profile
```http
GET /api/v1/user/profile
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "usr-123456",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "profilePicture": {
      "_id": "me-123456",
      "url": "https://example.com/profiles/john.png",
      "type": "image",
      "mimeType": "image/png"
    },
    "bio": "Software Developer",
    "createdAt": "2024-03-20T10:00:00Z",
    "updatedAt": "2024-03-20T10:00:00Z"
  }
}
```

### Update Profile
```http
PATCH /api/v1/user/profile
```
**Request Body:**
```json
{
  "name": "John Updated",
  "bio": "Full Stack Developer",
  "profilePicture": "me-789012" // MediaMeta ID for new profile picture
}
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "usr-123456",
    "name": "John Updated",
    "email": "john@example.com",
    "role": "user",
    "profilePicture": {
      "_id": "me-789012",
      "url": "https://example.com/profiles/john-new.png",
      "type": "image",
      "mimeType": "image/png"
    },
    "bio": "Full Stack Developer",
    "updatedAt": "2024-03-20T11:00:00Z"
  }
}
```

## Content Interaction

### Get Feed
```http
GET /api/v1/user/feed?page=1&limit=10&type=mixed
```
**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `type`: Content type (mixed, blog, video, reel)
- `categoryId`: Filter by category
- `featured`: Show only featured content

**Response:**
```json
{
  "status": "success",
  "data": {
    "results": [
      {
        "type": "blog",
        "content": {
          "_id": "blg-123456",
          "title": "Getting Started with Node.js",
          "description": "Learn Node.js basics",
          "blogSpecific": {
            "excerpt": "A brief introduction to Node.js",
            "readTime": "5 min",
            "thumbnailMetadata": {
              "_id": "me-123456",
              "url": "https://example.com/thumbnails/nodejs.png",
              "type": "image",
              "mimeType": "image/png"
            }
          },
          "categoryId": {
            "_id": "cat-123456",
            "name": "Technology",
            "slug": "technology"
          }
        }
      },
      {
        "type": "video",
        "content": {
          "_id": "vid-123456",
          "title": "Complete Node.js Course",
          "description": "Learn Node.js from scratch",
          "videoSpecific": {
            "duration": "01:30:00",
            "thumbnailMetadata": {
              "_id": "me-789012",
              "url": "https://example.com/thumbnails/nodejs-course.png",
              "type": "image",
              "mimeType": "image/png"
            }
          },
          "categoryId": {
            "_id": "cat-123456",
            "name": "Technology",
            "slug": "technology"
          }
        }
      }
    ],
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 2
  }
}
```

### Like Content
```http
POST /api/v1/user/interactions/like
```
**Request Body:**
```json
{
  "contentId": "blg-123456",
  "contentType": "blog"
}
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "contentId": "blg-123456",
    "contentType": "blog",
    "action": "like",
    "createdAt": "2024-03-20T10:00:00Z"
  }
}
```

### Comment on Content
```http
POST /api/v1/user/interactions/comment
```
**Request Body:**
```json
{
  "contentId": "blg-123456",
  "contentType": "blog",
  "text": "Great article! Very helpful."
}
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "cmt-123456",
    "contentId": "blg-123456",
    "contentType": "blog",
    "text": "Great article! Very helpful.",
    "user": {
      "_id": "usr-123456",
      "name": "John Doe",
      "profilePicture": {
        "_id": "me-123456",
        "url": "https://example.com/profiles/john.png"
      }
    },
    "createdAt": "2024-03-20T10:00:00Z"
  }
}
```

### Save Content
```http
POST /api/v1/user/interactions/save
```
**Request Body:**
```json
{
  "contentId": "blg-123456",
  "contentType": "blog"
}
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "contentId": "blg-123456",
    "contentType": "blog",
    "action": "save",
    "createdAt": "2024-03-20T10:00:00Z"
  }
}
```

## Notifications

### Get Notifications
```http
GET /api/v1/user/notifications?page=1&limit=10
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "results": [
      {
        "_id": "not-123456",
        "type": "like",
        "content": {
          "contentId": "blg-123456",
          "contentType": "blog",
          "title": "Getting Started with Node.js"
        },
        "user": {
          "_id": "usr-789012",
          "name": "Jane Smith",
          "profilePicture": {
            "_id": "me-789012",
            "url": "https://example.com/profiles/jane.png"
          }
        },
        "read": false,
        "createdAt": "2024-03-20T10:00:00Z"
      }
    ],
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 1
  }
}
```

### Mark Notification as Read
```http
PATCH /api/v1/user/notifications/:notificationId/read
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "not-123456",
    "read": true,
    "updatedAt": "2024-03-20T10:00:00Z"
  }
}
```

## Common Response Structure

### Success Response
```json
{
  "status": "success",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error message",
  "errors": [
    {
      "field": "fieldName",
      "message": "Error message for this field"
    }
  ]
}
```

## Important Notes

1. **Authentication**: All endpoints except signup and signin require authentication
2. **Token Format**: Include the access token in the Authorization header:
   ```
   Authorization: Bearer <access_token>
   ```
3. **Content Types**: 
   - blog
   - video
   - reel
4. **Interaction Types**:
   - like
   - comment
   - save
5. **Notification Types**:
   - like
   - comment
   - follow
   - mention
6. **ID Prefixes**:
   - Users: usr-
   - Content: blg-, vid-, rel-
   - Comments: cmt-
   - Notifications: not-
   - Media Metadata: me- 

## Content Sections

### Get Home Content
```http
GET /api/v1/user/home?page=1&limit=10
```
**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `categoryId`: Filter by category
- `featured`: Show only featured content

**Response:**
```json
{
  "status": "success",
  "data": {
    "featured": {
      "blogs": [
        {
          "_id": "blg-123456",
          "title": "Getting Started with Node.js",
          "description": "Learn Node.js basics",
          "blogSpecific": {
            "excerpt": "A brief introduction to Node.js",
            "readTime": "5 min",
            "thumbnailMetadata": {
              "_id": "me-123456",
              "url": "https://example.com/thumbnails/nodejs.png",
              "type": "image",
              "mimeType": "image/png"
            }
          },
          "categoryId": {
            "_id": "cat-123456",
            "name": "Technology",
            "slug": "technology"
          },
          "stats": {
            "views": 1000,
            "likes": 100,
            "comments": 50
          }
        }
      ],
      "videos": [
        {
          "_id": "vid-123456",
          "title": "Complete Node.js Course",
          "description": "Learn Node.js from scratch",
          "videoSpecific": {
            "duration": "01:30:00",
            "thumbnailMetadata": {
              "_id": "me-789012",
              "url": "https://example.com/thumbnails/nodejs-course.png",
              "type": "image",
              "mimeType": "image/png"
            }
          },
          "categoryId": {
            "_id": "cat-123456",
            "name": "Technology",
            "slug": "technology"
          },
          "stats": {
            "views": 5000,
            "likes": 500,
            "comments": 200
          }
        }
      ],
      "reels": [
        {
          "_id": "rel-123456",
          "title": "Quick Node.js Tips",
          "description": "5 tips to improve your Node.js code",
          "reelSpecific": {
            "duration": "00:01:30",
            "thumbnailMetadata": {
              "_id": "me-345678",
              "url": "https://example.com/thumbnails/nodejs-tips.png",
              "type": "image",
              "mimeType": "image/png"
            }
          },
          "categoryId": {
            "_id": "cat-123456",
            "name": "Technology",
            "slug": "technology"
          },
          "stats": {
            "views": 2000,
            "likes": 200,
            "comments": 100
          }
        }
      ]
    },
    "trending": {
      "blogs": [...],
      "videos": [...],
      "reels": [...]
    },
    "latest": {
      "blogs": [...],
      "videos": [...],
      "reels": [...]
    }
  }
}
```

### Get Video Section
```http
GET /api/v1/user/videos?page=1&limit=10
```
**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `categoryId`: Filter by category
- `sort`: Sort order (trending, latest, popular)
- `duration`: Filter by duration (short, medium, long)
- `featured`: Show only featured content

**Response:**
```json
{
  "status": "success",
  "data": {
    "results": [
      {
        "_id": "vid-123456",
        "title": "Complete Node.js Course",
        "description": "Learn Node.js from scratch",
        "videoSpecific": {
          "duration": "01:30:00",
          "thumbnailMetadata": {
            "_id": "me-789012",
            "url": "https://example.com/thumbnails/nodejs-course.png",
            "type": "image",
            "mimeType": "image/png"
          },
          "contentMetadata": {
            "_id": "me-789013",
            "url": "https://example.com/videos/nodejs-course.mp4",
            "type": "video",
            "mimeType": "video/mp4",
            "size": 1024000,
            "metadata": {
              "duration": 5400,
              "width": 1920,
              "height": 1080,
              "format": "mp4"
            }
          }
        },
        "categoryId": {
          "_id": "cat-123456",
          "name": "Technology",
          "slug": "technology"
        },
        "stats": {
          "views": 5000,
          "likes": 500,
          "comments": 200
        },
        "createdAt": "2024-03-20T10:00:00Z"
      }
    ],
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 1
  }
}
```

### Get Reels Section
```http
GET /api/v1/user/reels?page=1&limit=10
```
**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `categoryId`: Filter by category
- `sort`: Sort order (trending, latest, popular)
- `featured`: Show only featured content

**Response:**
```json
{
  "status": "success",
  "data": {
    "results": [
      {
        "_id": "rel-123456",
        "title": "Quick Node.js Tips",
        "description": "5 tips to improve your Node.js code",
        "reelSpecific": {
          "duration": "00:01:30",
          "thumbnailMetadata": {
            "_id": "me-345678",
            "url": "https://example.com/thumbnails/nodejs-tips.png",
            "type": "image",
            "mimeType": "image/png"
          },
          "contentMetadata": {
            "_id": "me-345679",
            "url": "https://example.com/reels/nodejs-tips.mp4",
            "type": "video",
            "mimeType": "video/mp4",
            "size": 512000,
            "metadata": {
              "duration": 90,
              "width": 1080,
              "height": 1920,
              "format": "mp4"
            }
          }
        },
        "categoryId": {
          "_id": "cat-123456",
          "name": "Technology",
          "slug": "technology"
        },
        "stats": {
          "views": 2000,
          "likes": 200,
          "comments": 100
        },
        "createdAt": "2024-03-20T10:00:00Z"
      }
    ],
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 1
  }
}
```

### Get Blog Section
```http
GET /api/v1/user/blogs?page=1&limit=10
```
**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `categoryId`: Filter by category
- `sort`: Sort order (trending, latest, popular)
- `readTime`: Filter by read time (short, medium, long)
- `featured`: Show only featured content

**Response:**
```json
{
  "status": "success",
  "data": {
    "results": [
      {
        "_id": "blg-123456",
        "title": "Getting Started with Node.js",
        "description": "Learn Node.js basics",
        "blogSpecific": {
          "excerpt": "A brief introduction to Node.js",
          "readTime": "5 min",
          "thumbnailMetadata": {
            "_id": "me-123456",
            "url": "https://example.com/thumbnails/nodejs.png",
            "type": "image",
            "mimeType": "image/png"
          },
          "contentMetadata": {
            "_id": "me-123457",
            "url": "https://example.com/blogs/nodejs-intro.html",
            "type": "html",
            "mimeType": "text/html",
            "size": 256000,
            "metadata": {
              "pages": 1,
              "wordCount": 1000
            }
          }
        },
        "categoryId": {
          "_id": "cat-123456",
          "name": "Technology",
          "slug": "technology"
        },
        "stats": {
          "views": 1000,
          "likes": 100,
          "comments": 50
        },
        "createdAt": "2024-03-20T10:00:00Z"
      }
    ],
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 1
  }
}
``` 