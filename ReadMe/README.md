# Proofie - Creative Proofing & Collaboration Tool

A Django-based creative proofing and collaboration platform. This tool enables teams to manage creative assets, track versions, annotate files, and execute multi-stage approval workflows with real-time notifications.

## Features

### 1. Versioned File Management
- Upload creative assets (PDFs, Images, Videos)
- Automatic version tracking with change notes
- Current version management
- File metadata and thumbnails
- Support for large file uploads (up to 500MB)

### 2. Annotation System
- Pin-point annotations with X/Y coordinates
- Support for multiple annotation types (comments, highlights, shapes)
- Page-specific annotations for multi-page documents
- Color-coded annotations
- Annotation replies and threaded discussions
- User mentions within annotations
- Resolve/unresolve annotation tracking

### 3. Review Workflows
- Multi-stage approval cycles
- Customizable workflow templates
- Stage-specific approvers
- Approval, rejection, and change request statuses
- Workflow transitions with audit trail
- Feedback and notes at each stage

### 4. Real-time Notifications
- WebSocket-based real-time updates
- Email notifications
- Push notifications
- In-app notification center
- Notification preferences per user
- Notification history and logs

### 5. Project Management
- Create and manage projects
- Add team members with role-based access (Admin, Reviewer, Viewer)
- Organize assets within projects
- Project-level permissions

## Project Structure

```
Proofie/
├── config/                 # Django configuration
│   ├── settings.py        # Main settings
│   ├── urls.py            # URL routing
│   ├── asgi.py            # ASGI configuration (WebSockets)
│   └── wsgi.py            # WSGI configuration
├── apps/
│   ├── versioning/        # File versioning app
│   ├── annotations/       # Annotation system
│   ├── workflows/         # Review workflows
│   ├── notifications/     # Real-time notifications
│   └── accounts/          # User management
├── manage.py              # Django management script
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

## Installation

### Prerequisites
- Python 3.10+
- PostgreSQL (optional, SQLite for development)
- Redis (for real-time notifications and caching)

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd Proofie
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Run migrations**
```bash
python manage.py makemigrations
python manage.py migrate
```

6. **Create superuser**
```bash
python manage.py createsuperuser
```

7. **Collect static files**
```bash
python manage.py collectstatic --noinput
```

## Running the Application

### Development Server

**Terminal 1 - Django Development Server:**
```bash
python manage.py runserver
```

**Terminal 2 - Celery Worker (for background tasks):**
```bash
celery -A config worker -l info
```

**Terminal 3 - Redis Server:**
```bash
redis-server
```

The API will be available at `http://localhost:8000/api/`

### Using Daphne (with WebSocket support)

```bash
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

## API Endpoints

### Authentication
- `POST /api/auth/token/` - Get authentication token
- `POST /api/accounts/users/register/` - Register new user

### Projects
- `GET /api/versioning/projects/` - List projects
- `POST /api/versioning/projects/` - Create project
- `GET /api/versioning/projects/{id}/` - Get project details
- `POST /api/versioning/projects/{id}/add_member/` - Add team member
- `DELETE /api/versioning/projects/{id}/remove_member/` - Remove team member

### Creative Assets
- `GET /api/versioning/assets/` - List assets
- `POST /api/versioning/assets/` - Upload new asset
- `GET /api/versioning/assets/{id}/` - Get asset details
- `POST /api/versioning/assets/{id}/upload_version/` - Upload new version
- `GET /api/versioning/assets/{id}/versions/` - Get version history

### Annotations
- `GET /api/annotations/` - List annotations
- `POST /api/annotations/` - Create annotation
- `GET /api/annotations/{id}/` - Get annotation details
- `POST /api/annotations/{id}/resolve/` - Mark as resolved
- `POST /api/annotations/{id}/unresolve/` - Mark as unresolved
- `POST /api/annotations/{id}/add_reply/` - Add reply to annotation

### Workflows
- `GET /api/workflows/templates/` - List workflow templates
- `POST /api/workflows/templates/` - Create workflow template
- `GET /api/workflows/review-cycles/` - List review cycles
- `POST /api/workflows/review-cycles/` - Start review cycle
- `POST /api/workflows/review-cycles/{id}/approve_stage/` - Approve stage
- `POST /api/workflows/review-cycles/{id}/reject_stage/` - Reject stage
- `POST /api/workflows/review-cycles/{id}/request_changes/` - Request changes

### Notifications
- `GET /api/notifications/` - List notifications
- `POST /api/notifications/{id}/mark_as_read/` - Mark notification as read
- `POST /api/notifications/mark_all_as_read/` - Mark all as read
- `GET /api/notifications/unread_count/` - Get unread count
- `GET /api/notifications/preferences/my_preferences/` - Get preferences
- `PUT /api/notifications/preferences/update_preferences/` - Update preferences

### User Accounts
- `GET /api/accounts/users/me/` - Get current user
- `PUT /api/accounts/users/update_profile/` - Update profile

## WebSocket Connections

### Notifications WebSocket
```
ws://localhost:8000/ws/notifications/{user_id}/
```

Connect to receive real-time notifications for a specific user.

## Database Models

### Versioning
- **Project** - Collaborative projects
- **ProjectMember** - Team members with roles
- **CreativeAsset** - Digital assets (PDFs, images, videos)
- **FileVersion** - Version history for assets
- **VersionComment** - Comments on specific versions

### Annotations
- **Annotation** - Pin-point annotations with coordinates
- **AnnotationReply** - Threaded replies to annotations
- **AnnotationMention** - User mentions in annotations

### Workflows
- **WorkflowTemplate** - Reusable approval workflows
- **WorkflowStage** - Individual stages in a workflow
- **WorkflowStageApprover** - Approvers for each stage
- **ReviewCycle** - Active review process for an asset
- **StageApproval** - Approval status for each stage
- **WorkflowTransition** - Audit trail of stage transitions

### Notifications
- **Notification** - User notifications
- **NotificationPreference** - User notification settings
- **NotificationLog** - Delivery logs for notifications

### Accounts
- **UserProfile** - Extended user information

## Testing

Run the test suite:
```bash
python manage.py test
```

Run tests for a specific app:
```bash
python manage.py test apps.versioning
python manage.py test apps.annotations
python manage.py test apps.workflows
python manage.py test apps.notifications
python manage.py test apps.accounts
```

## Admin Interface

Access the Django admin at `http://localhost:8000/admin/` with your superuser credentials.

## Configuration

### File Upload Settings
- **Max file size**: 500MB
- **Allowed file types**: PDF, JPG, JPEG, PNG, GIF, MP4, WEBM, MOV

### Notification Settings
- **Default delivery method**: WebSocket (real-time)
- **Alternative methods**: Email, Push, In-app
- **Digest frequencies**: Instant, Daily, Weekly, Never

## Security Considerations

1. **Environment Variables**: Never commit `.env` file to version control
2. **Secret Key**: Change `SECRET_KEY` in production
3. **DEBUG**: Set `DEBUG=False` in production
4. **CORS**: Configure `CORS_ALLOWED_ORIGINS` for your frontend domain
5. **Database**: Use PostgreSQL in production instead of SQLite
6. **SSL/TLS**: Enable HTTPS in production
7. **Authentication**: Use token-based authentication for API

## Performance Optimization

1. **Caching**: Redis is configured for caching
2. **Async Tasks**: Celery handles background tasks
3. **Database Indexing**: Optimized indexes on frequently queried fields
4. **Pagination**: API responses are paginated (20 items per page)

## Troubleshooting

### Redis Connection Error
Ensure Redis is running:
```bash
redis-server
```

### Database Migration Issues
```bash
python manage.py makemigrations
python manage.py migrate --run-syncdb
```

### WebSocket Connection Issues
- Ensure Daphne is running instead of Django dev server
- Check CORS settings in `config/settings.py`
- Verify WebSocket URL in frontend matches backend

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests for new functionality
4. Run test suite to ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues, questions, or contributions, please contact the development team.
