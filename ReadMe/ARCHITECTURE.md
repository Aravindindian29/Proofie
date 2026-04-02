# Proofie Architecture

## System Overview

Proofie is a full-stack creative proofing and collaboration platform built with Django and React. It enables teams to manage creative assets, track versions, annotate files, execute multi-stage approval workflows, and receive real-time notifications.

## Technology Stack

### Backend
- **Framework**: Django 4.2.11
- **API**: Django REST Framework 3.14.0
- **Real-time**: Django Channels 4.0.0 with Redis
- **Task Queue**: Celery 5.3.4
- **Database**: PostgreSQL (production) / SQLite (development)
- **Cache**: Redis 5.0.1
- **File Storage**: Django Storages with S3 support

### Frontend
- **Framework**: React 18.2.0
- **Routing**: React Router v6
- **State Management**: Zustand 4.4.1
- **HTTP Client**: Axios 1.6.2
- **Styling**: TailwindCSS 3.3.6
- **Build Tool**: Vite 5.0.8
- **Icons**: Lucide React 0.294.0

## Project Structure

```
Proofie/
├── backend/
│   ├── config/                 # Django configuration
│   │   ├── settings.py        # Main settings
│   │   ├── urls.py            # URL routing
│   │   ├── asgi.py            # ASGI for WebSockets
│   │   ├── wsgi.py            # WSGI for HTTP
│   │   └── celery.py          # Celery configuration
│   ├── apps/
│   │   ├── versioning/        # File versioning
│   │   ├── annotations/       # Annotation system
│   │   ├── workflows/         # Review workflows
│   │   ├── notifications/     # Real-time notifications
│   │   └── accounts/          # User management
│   ├── manage.py
│   ├── requirements.txt
│   └── docker-compose.yml
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── stores/           # Zustand stores
│   │   ├── services/         # API services
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── README.md
├── SETUP.md
└── ARCHITECTURE.md
```

## Core Modules

### 1. Versioning Module (`apps/versioning`)

**Purpose**: Manage creative assets and their version history.

**Models**:
- `Project`: Collaborative projects
- `ProjectMember`: Team members with roles (Admin, Reviewer, Viewer)
- `CreativeAsset`: Digital assets (PDFs, images, videos)
- `FileVersion`: Version history with change notes
- `VersionComment`: Comments on specific versions

**Key Features**:
- Upload assets with automatic version tracking
- Store file metadata and thumbnails
- Support for large files (up to 500MB)
- Version comparison and history

**API Endpoints**:
- `POST /api/versioning/projects/` - Create project
- `GET /api/versioning/projects/` - List projects
- `POST /api/versioning/assets/` - Upload asset
- `POST /api/versioning/assets/{id}/upload_version/` - Upload new version

### 2. Annotations Module (`apps/annotations`)

**Purpose**: Store and manage pin-point annotations on creative assets.

**Models**:
- `Annotation`: Pin-point comments with X/Y coordinates
- `AnnotationReply`: Threaded replies to annotations
- `AnnotationMention`: User mentions in annotations

**Key Features**:
- X/Y coordinate storage for precise positioning
- Multiple annotation types (comment, highlight, shape)
- Color-coded annotations
- Threaded discussion support
- User mentions and notifications
- Resolve/unresolve tracking

**API Endpoints**:
- `POST /api/annotations/` - Create annotation
- `GET /api/annotations/?version_id={id}` - Get annotations for version
- `POST /api/annotations/{id}/resolve/` - Mark as resolved
- `POST /api/annotations/{id}/add_reply/` - Add reply

### 3. Workflows Module (`apps/workflows`)

**Purpose**: Manage multi-stage approval cycles.

**Models**:
- `WorkflowTemplate`: Reusable approval workflows
- `WorkflowStage`: Individual stages in a workflow
- `WorkflowStageApprover`: Approvers for each stage
- `ReviewCycle`: Active review process for an asset
- `StageApproval`: Approval status for each stage
- `WorkflowTransition`: Audit trail of transitions

**Key Features**:
- Multi-stage approval workflows
- Customizable stages and approvers
- Approval, rejection, and change request statuses
- Automatic stage progression
- Feedback and notes at each stage
- Complete audit trail

**API Endpoints**:
- `POST /api/workflows/templates/` - Create template
- `POST /api/workflows/review-cycles/` - Start review cycle
- `POST /api/workflows/review-cycles/{id}/approve_stage/` - Approve
- `POST /api/workflows/review-cycles/{id}/reject_stage/` - Reject

### 4. Notifications Module (`apps/notifications`)

**Purpose**: Real-time notifications and user preferences.

**Models**:
- `Notification`: User notifications
- `NotificationPreference`: User notification settings
- `NotificationLog`: Delivery logs

**Key Features**:
- WebSocket-based real-time updates
- Multiple delivery methods (in-app, email, push)
- User notification preferences
- Notification history and logs
- Automatic notifications on key events

**WebSocket Endpoint**:
- `ws://localhost:8000/ws/notifications/{user_id}/`

**API Endpoints**:
- `GET /api/notifications/` - List notifications
- `POST /api/notifications/{id}/mark_as_read/` - Mark as read
- `GET /api/notifications/preferences/my_preferences/` - Get preferences
- `PUT /api/notifications/preferences/update_preferences/` - Update preferences

### 5. Accounts Module (`apps/accounts`)

**Purpose**: User management and profiles.

**Models**:
- `UserProfile`: Extended user information

**Key Features**:
- User registration and authentication
- Profile management
- Automatic profile creation on user signup
- Notification preferences initialization

**API Endpoints**:
- `POST /api/accounts/users/register/` - Register user
- `GET /api/accounts/users/me/` - Get current user
- `PUT /api/accounts/users/update_profile/` - Update profile

## Data Flow

### Asset Upload Flow
1. User uploads file via frontend
2. Django creates CreativeAsset and FileVersion
3. File stored in media directory (or S3)
4. Thumbnail generated for preview
5. Notification sent to project members

### Annotation Flow
1. User creates annotation with X/Y coordinates
2. Annotation stored in database
3. Mentioned users notified
4. Real-time update via WebSocket
5. Author can resolve annotation

### Review Workflow Flow
1. User initiates review cycle with template
2. First stage approvers assigned
3. Approvers receive notifications
4. Approver approves/rejects/requests changes
5. Automatic progression to next stage
6. Audit trail maintained throughout

### Notification Flow
1. Event triggered (annotation, approval, etc.)
2. Signal handler creates Notification
3. Notification sent via WebSocket
4. Optional email/push delivery
5. User can mark as read
6. Stored in notification history

## Authentication & Authorization

### Token-Based Authentication
- Django REST Framework token authentication
- Tokens issued on login
- Tokens stored in localStorage on frontend
- Automatic token refresh on 401 responses

### Role-Based Access Control
- Project-level roles: Admin, Reviewer, Viewer
- Permissions checked at API level
- Custom permission classes for each module

## Real-Time Communication

### WebSocket Implementation
- Django Channels for WebSocket support
- Redis as channel layer
- User-specific notification channels
- Automatic connection management

### Event Signals
- Django signals trigger on model changes
- Automatic notification creation
- WebSocket broadcast to relevant users

## Database Schema Highlights

### Key Relationships
- Project → ProjectMember → User (many-to-many)
- CreativeAsset → FileVersion (one-to-many)
- FileVersion → Annotation (one-to-many)
- ReviewCycle → StageApproval (one-to-many)
- Annotation → AnnotationReply (one-to-many)

### Indexing Strategy
- Indexed on frequently queried fields
- Composite indexes for common filters
- Foreign key indexes for relationships

## Performance Considerations

### Caching
- Redis for session caching
- Query result caching for frequently accessed data
- Cache invalidation on updates

### Database Optimization
- Connection pooling with psycopg2
- Query optimization with select_related/prefetch_related
- Pagination for large result sets (20 items per page)

### File Handling
- Async file uploads with progress tracking
- Thumbnail generation for previews
- S3 integration for scalable storage

## Deployment Architecture

### Development
- Django dev server on port 8000
- React dev server on port 3000
- SQLite database
- Redis on port 6379

### Production (Docker)
- Daphne ASGI server for WebSocket support
- Celery worker for background tasks
- PostgreSQL database
- Redis for caching and channels
- Nginx reverse proxy (recommended)

## Security Measures

1. **CSRF Protection**: Django CSRF middleware
2. **CORS**: Configurable CORS headers
3. **SQL Injection**: ORM parameterized queries
4. **XSS Protection**: React automatic escaping
5. **Authentication**: Token-based with secure storage
6. **File Upload**: Extension validation and size limits
7. **Environment Variables**: Sensitive data in .env

## Scalability Considerations

1. **Horizontal Scaling**: Stateless API servers
2. **Database Scaling**: PostgreSQL replication ready
3. **Cache Scaling**: Redis cluster support
4. **File Storage**: S3 integration for distributed storage
5. **Task Queue**: Celery for distributed processing

## Monitoring & Logging

### Backend Logging
- Django logging configuration
- Celery task logging
- WebSocket connection logging

### Frontend Logging
- Console logging for development
- Error tracking ready for Sentry integration

## Future Enhancements

1. **Advanced Annotations**: Drawing tools, shape annotations
2. **Real-time Collaboration**: Live cursor tracking
3. **AI Integration**: Auto-tagging, smart suggestions
4. **Mobile App**: React Native mobile client
5. **Advanced Analytics**: Usage and performance metrics
6. **Integrations**: Slack, Teams, Jira integration
7. **Version Comparison**: Visual diff for assets
8. **Bulk Operations**: Batch upload and processing
