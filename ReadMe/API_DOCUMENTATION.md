# Proofie API Documentation

## Base URL

```
http://localhost:8000/api
```

## Authentication

All endpoints (except `/auth/token/` and `/accounts/users/register/`) require token authentication.

### Get Token

```http
POST /auth/token/
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

**Response:**
```json
{
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b"
}
```

### Using Token

Include the token in the Authorization header:

```
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b
```

## Versioning API

### Projects

#### List Projects
```http
GET /versioning/projects/
```

**Response:**
```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "My Project",
      "description": "Project description",
      "owner": {
        "id": 1,
        "username": "john",
        "email": "john@example.com"
      },
      "members": [],
      "member_count": 0,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "is_active": true
    }
  ]
}
```

#### Create Project
```http
POST /versioning/projects/
Content-Type: application/json

{
  "name": "New Project",
  "description": "Project description"
}
```

#### Get Project
```http
GET /versioning/projects/{id}/
```

#### Update Project
```http
PUT /versioning/projects/{id}/
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

#### Add Member
```http
POST /versioning/projects/{id}/add_member/
Content-Type: application/json

{
  "user_id": 2,
  "role": "reviewer"
}
```

**Roles:** `admin`, `reviewer`, `viewer`

#### Remove Member
```http
DELETE /versioning/projects/{id}/remove_member/
Content-Type: application/json

{
  "user_id": 2
}
```

### Creative Assets

#### List Assets
```http
GET /versioning/assets/?project_id={project_id}
```

**Query Parameters:**
- `project_id`: Filter by project
- `file_type`: Filter by type (pdf, image, video)
- `is_archived`: Filter by archive status

#### Create Asset
```http
POST /versioning/assets/
Content-Type: multipart/form-data

project: 1
name: My Asset
file_type: image
file: <binary>
description: Asset description (optional)
```

#### Get Asset
```http
GET /versioning/assets/{id}/
```

#### Upload New Version
```http
POST /versioning/assets/{id}/upload_version/
Content-Type: multipart/form-data

file: <binary>
change_notes: What changed in this version
```

#### Get Version History
```http
GET /versioning/assets/{id}/versions/
```

### File Versions

#### List Versions
```http
GET /versioning/versions/?asset={asset_id}
```

#### Get Version
```http
GET /versioning/versions/{id}/
```

#### Add Comment
```http
POST /versioning/versions/{id}/add_comment/
Content-Type: application/json

{
  "content": "This version looks good"
}
```

#### Get Comments
```http
GET /versioning/versions/{id}/comments/
```

## Annotations API

### List Annotations
```http
GET /annotations/?version_id={version_id}
```

**Query Parameters:**
- `version_id`: Filter by version
- `author`: Filter by author ID
- `annotation_type`: Filter by type
- `is_resolved`: Filter by resolution status
- `page_number`: Filter by page

### Create Annotation
```http
POST /annotations/
Content-Type: application/json

{
  "version": 1,
  "annotation_type": "comment",
  "x_coordinate": 100.5,
  "y_coordinate": 200.5,
  "page_number": 1,
  "content": "This needs revision",
  "color": "#FF0000",
  "mentioned_user_ids": [2, 3]
}
```

**Annotation Types:** `comment`, `highlight`, `shape`

### Get Annotation
```http
GET /annotations/{id}/
```

### Update Annotation
```http
PUT /annotations/{id}/
Content-Type: application/json

{
  "content": "Updated comment"
}
```

### Resolve Annotation
```http
POST /annotations/{id}/resolve/
```

### Unresolve Annotation
```http
POST /annotations/{id}/unresolve/
```

### Add Reply
```http
POST /annotations/{id}/add_reply/
Content-Type: application/json

{
  "content": "I agree with this comment"
}
```

### Get Replies
```http
GET /annotations/{id}/replies/
```

## Workflows API

### Workflow Templates

#### List Templates
```http
GET /workflows/templates/
```

#### Create Template
```http
POST /workflows/templates/
Content-Type: application/json

{
  "name": "Standard Review",
  "description": "Internal review then client review"
}
```

#### Get Template
```http
GET /workflows/templates/{id}/
```

### Review Cycles

#### List Review Cycles
```http
GET /workflows/review-cycles/
```

**Query Parameters:**
- `asset`: Filter by asset ID
- `template`: Filter by template ID
- `status`: Filter by status
- `initiated_by`: Filter by initiator

#### Create Review Cycle
```http
POST /workflows/review-cycles/
Content-Type: application/json

{
  "asset": 1,
  "template_id": 1,
  "notes": "Please review this asset"
}
```

**Statuses:** `draft`, `in_progress`, `completed`, `rejected`

#### Get Review Cycle
```http
GET /workflows/review-cycles/{id}/
```

#### Approve Stage
```http
POST /workflows/review-cycles/{id}/approve_stage/
Content-Type: application/json

{
  "feedback": "Looks great!"
}
```

#### Reject Stage
```http
POST /workflows/review-cycles/{id}/reject_stage/
Content-Type: application/json

{
  "feedback": "Needs more work"
}
```

#### Request Changes
```http
POST /workflows/review-cycles/{id}/request_changes/
Content-Type: application/json

{
  "feedback": "Please adjust the colors"
}
```

## Notifications API

### List Notifications
```http
GET /notifications/
```

**Query Parameters:**
- `notification_type`: Filter by type
- `is_read`: Filter by read status

### Get Notification
```http
GET /notifications/{id}/
```

### Mark as Read
```http
POST /notifications/{id}/mark_as_read/
```

### Mark All as Read
```http
POST /notifications/mark_all_as_read/
```

### Get Unread Count
```http
GET /notifications/unread_count/
```

**Response:**
```json
{
  "unread_count": 5
}
```

### Get Preferences
```http
GET /notifications/preferences/my_preferences/
```

### Update Preferences
```http
PUT /notifications/preferences/update_preferences/
Content-Type: application/json

{
  "email_on_comment": true,
  "email_on_annotation": true,
  "email_on_approval": true,
  "push_on_comment": true,
  "digest_frequency": "instant"
}
```

## Accounts API

### Register User
```http
POST /accounts/users/register/
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "password": "securepassword123",
  "password_confirm": "securepassword123"
}
```

### Get Current User
```http
GET /accounts/users/me/
```

### Update Profile
```http
PUT /accounts/users/update_profile/
Content-Type: application/json

{
  "bio": "Creative director",
  "phone": "+1 (555) 000-0000",
  "company": "Acme Corp",
  "job_title": "Creative Director"
}
```

## WebSocket API

### Connect to Notifications

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/notifications/1/');

ws.onopen = function(e) {
  console.log('Connected');
};

ws.onmessage = function(e) {
  const data = JSON.parse(e.data);
  console.log('Notification:', data);
};

ws.onerror = function(error) {
  console.error('WebSocket error:', error);
};

ws.onclose = function(e) {
  console.log('Disconnected');
};
```

### Notification Message Format

```json
{
  "type": "notification",
  "data": {
    "id": 1,
    "recipient": 1,
    "notification_type": "comment_added",
    "title": "New Comment",
    "message": "John added a comment on your asset",
    "is_read": false,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "field_name": ["Error message"]
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

## Rate Limiting

Currently no rate limiting is implemented. For production, consider implementing:
- Per-user rate limits
- Per-IP rate limits
- Throttling for expensive operations

## Pagination

List endpoints support pagination with the following parameters:
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

**Response:**
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/notifications/?page=2",
  "previous": null,
  "results": [...]
}
```

## Filtering

Most list endpoints support filtering:

```http
GET /versioning/assets/?project_id=1&file_type=image&is_archived=false
```

## Sorting

Most list endpoints support sorting:

```http
GET /versioning/projects/?ordering=-created_at
```

Use `-` prefix for descending order.

## File Upload Limits

- **Max file size**: 500MB
- **Allowed types**: PDF, JPG, JPEG, PNG, GIF, MP4, WEBM, MOV

## Response Headers

All responses include:
- `Content-Type: application/json`
- `X-Request-ID`: Unique request identifier (for debugging)

## Versioning

API version is included in the URL path. Current version: `v1` (implicit)

For future versions, use:
```
/api/v2/versioning/projects/
```

## Deprecation Policy

Deprecated endpoints will be marked with `X-API-Deprecated` header and will be removed after 6 months notice.
