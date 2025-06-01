# Admin API Endpoints Documentation

## Authentication
All admin endpoints require authentication. Include the admin token in the Authorization header:
```
Authorization: Bearer <admin_token>
```

## Category Management

### Create Category
```http
POST /api/v1/admin/categories
```
**Request Body:**
```json
{
  "name": "Technology",
  "slug": "technology",
  "description": "Technology related content",
  "icon": "me-123456", // MediaMeta ID for category icon
  "status": "active"
}
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "cat-123456",
    "name": "Technology",
    "slug": "technology",
    "description": "Technology related content",
    "icon": {
      "_id": "me-123456",
      "url": "https://example.com/icons/tech.png",
      "type": "image",
      "mimeType": "image/png"
    },
    "status": "active",
    "createdAt": "2024-03-20T10:00:00Z",
    "updatedAt": "2024-03-20T10:00:00Z"
  }
}
```

### Get Categories
```http
GET /api/v1/admin/categories?page=1&limit=10&sortBy=createdAt:desc
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "results": [
      {
        "_id": "cat-123456",
        "name": "Technology",
        "slug": "technology",
        "description": "Technology related content",
        "icon": {
          "_id": "me-123456",
          "url": "https://example.com/icons/tech.png",
          "type": "image",
          "mimeType": "image/png"
        },
        "status": "active"
      }
    ],
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 1
  }
}
```

## Blog Management

### Create Blog
```http
POST /api/v1/admin/blogs
```
**Request Body:**
```json
{
  "title": "Getting Started with Node.js",
  "slug": "getting-started-with-nodejs",
  "description": "Learn Node.js basics",
  "thumbnailMetadata": "me-123456", // MediaMeta ID for thumbnail
  "contentMetadata": "me-789012", // MediaMeta ID for blog content
  "categoryId": "cat-123456",
  "excerpt": "A brief introduction to Node.js",
  "readTime": "5 min",
  "status": "draft",
  "featured": false
}
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "blg-123456",
    "title": "Getting Started with Node.js",
    "slug": "getting-started-with-nodejs",
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
        "_id": "me-789012",
        "url": "https://example.com/blogs/nodejs.pdf",
        "type": "pdf",
        "mimeType": "application/pdf"
      },
      "categoryId": {
        "_id": "cat-123456",
        "name": "Technology",
        "slug": "technology"
      }
    },
    "status": "draft",
    "featured": false,
    "createdAt": "2024-03-20T10:00:00Z",
    "updatedAt": "2024-03-20T10:00:00Z"
  }
}
```

### Get Blogs
```http
GET /api/v1/admin/blogs?page=1&limit=10&sortBy=createdAt:desc&categoryId=cat-123456&featured=true
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "results": [
      {
        "_id": "blg-123456",
        "title": "Getting Started with Node.js",
        "slug": "getting-started-with-nodejs",
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
            "_id": "me-789012",
            "url": "https://example.com/blogs/nodejs.pdf",
            "type": "pdf",
            "mimeType": "application/pdf"
          },
          "categoryId": {
            "_id": "cat-123456",
            "name": "Technology",
            "slug": "technology"
          }
        },
        "status": "draft",
        "featured": false
      }
    ],
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 1
  }
}
```

## Reel Management

### Create Reel
```http
POST /api/v1/admin/reels
```
**Request Body:**
```json
{
  "title": "Quick Node.js Tips",
  "slug": "quick-nodejs-tips",
  "description": "Short tips for Node.js developers",
  "thumbnailMetadata": "me-123456", // MediaMeta ID for thumbnail
  "contentMetadata": "me-789012", // MediaMeta ID for reel content
  "categoryId": "cat-123456",
  "duration": "00:01:30",
  "status": "draft",
  "featured": false
}
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "rel-123456",
    "title": "Quick Node.js Tips",
    "slug": "quick-nodejs-tips",
    "description": "Short tips for Node.js developers",
    "reelSpecific": {
      "duration": "00:01:30",
      "thumbnailMetadata": {
        "_id": "me-123456",
        "url": "https://example.com/thumbnails/nodejs-tips.png",
        "type": "image",
        "mimeType": "image/png"
      },
      "contentMetadata": {
        "_id": "me-789012",
        "url": "https://example.com/reels/nodejs-tips.mp4",
        "type": "video",
        "mimeType": "video/mp4",
        "metadata": {
          "duration": "00:01:30",
          "width": 1920,
          "height": 1080,
          "format": "mp4"
        }
      },
      "categoryId": {
        "_id": "cat-123456",
        "name": "Technology",
        "slug": "technology"
      }
    },
    "status": "draft",
    "featured": false,
    "createdAt": "2024-03-20T10:00:00Z",
    "updatedAt": "2024-03-20T10:00:00Z"
  }
}
```

### Get Reels
```http
GET /api/v1/admin/reels?page=1&limit=10&sortBy=createdAt:desc&categoryId=cat-123456&featured=true
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "results": [
      {
        "_id": "rel-123456",
        "title": "Quick Node.js Tips",
        "slug": "quick-nodejs-tips",
        "description": "Short tips for Node.js developers",
        "reelSpecific": {
          "duration": "00:01:30",
          "thumbnailMetadata": {
            "_id": "me-123456",
            "url": "https://example.com/thumbnails/nodejs-tips.png",
            "type": "image",
            "mimeType": "image/png"
          },
          "contentMetadata": {
            "_id": "me-789012",
            "url": "https://example.com/reels/nodejs-tips.mp4",
            "type": "video",
            "mimeType": "video/mp4",
            "metadata": {
              "duration": "00:01:30",
              "width": 1920,
              "height": 1080,
              "format": "mp4"
            }
          },
          "categoryId": {
            "_id": "cat-123456",
            "name": "Technology",
            "slug": "technology"
          }
        },
        "status": "draft",
        "featured": false
      }
    ],
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 1
  }
}
```

## Video Management

### Create Video
```http
POST /api/v1/admin/videos
```
**Request Body:**
```json
{
  "title": "Complete Node.js Course",
  "slug": "complete-nodejs-course",
  "description": "Learn Node.js from scratch",
  "thumbnailMetadata": "me-123456", // MediaMeta ID for thumbnail
  "contentMetadata": "me-789012", // MediaMeta ID for video content
  "categoryId": "cat-123456",
  "duration": "01:30:00",
  "status": "draft",
  "featured": false
}
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "vid-123456",
    "title": "Complete Node.js Course",
    "slug": "complete-nodejs-course",
    "description": "Learn Node.js from scratch",
    "videoSpecific": {
      "duration": "01:30:00",
      "thumbnailMetadata": {
        "_id": "me-123456",
        "url": "https://example.com/thumbnails/nodejs-course.png",
        "type": "image",
        "mimeType": "image/png"
      },
      "contentMetadata": {
        "_id": "me-789012",
        "url": "https://example.com/videos/nodejs-course.mp4",
        "type": "video",
        "mimeType": "video/mp4",
        "metadata": {
          "duration": "01:30:00",
          "width": 1920,
          "height": 1080,
          "format": "mp4"
        }
      },
      "categoryId": {
        "_id": "cat-123456",
        "name": "Technology",
        "slug": "technology"
      }
    },
    "status": "draft",
    "featured": false,
    "createdAt": "2024-03-20T10:00:00Z",
    "updatedAt": "2024-03-20T10:00:00Z"
  }
}
```

### Get Videos
```http
GET /api/v1/admin/videos?page=1&limit=10&sortBy=createdAt:desc&categoryId=cat-123456&featured=true
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "results": [
      {
        "_id": "vid-123456",
        "title": "Complete Node.js Course",
        "slug": "complete-nodejs-course",
        "description": "Learn Node.js from scratch",
        "videoSpecific": {
          "duration": "01:30:00",
          "thumbnailMetadata": {
            "_id": "me-123456",
            "url": "https://example.com/thumbnails/nodejs-course.png",
            "type": "image",
            "mimeType": "image/png"
          },
          "contentMetadata": {
            "_id": "me-789012",
            "url": "https://example.com/videos/nodejs-course.mp4",
            "type": "video",
            "mimeType": "video/mp4",
            "metadata": {
              "duration": "01:30:00",
              "width": 1920,
              "height": 1080,
              "format": "mp4"
            }
          },
          "categoryId": {
            "_id": "cat-123456",
            "name": "Technology",
            "slug": "technology"
          }
        },
        "status": "draft",
        "featured": false
      }
    ],
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 1
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

### Paginated Response
```json
{
  "status": "success",
  "data": {
    "results": [],
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 0
  }
}
```

## Important Notes

1. **Authentication**: All endpoints require admin authentication
2. **Media Files**: Media files must be uploaded first to get MediaMeta IDs
3. **Category Validation**: Category IDs must exist before creating content
4. **Status Values**: 
   - Categories: active, inactive
   - Content: draft, published, archived
5. **Timestamp Format**: ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
6. **ID Prefixes**:
   - Categories: cat-
   - Blogs: blg-
   - Reels: rel-
   - Videos: vid-
   - Media Metadata: me- 