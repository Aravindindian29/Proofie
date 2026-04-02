# Proofie Setup Guide

## Quick Start

### 1. Environment Setup

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Database Setup

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### 3. Running the Application

**Option A: Development with Django Dev Server**

Terminal 1:
```bash
python manage.py runserver
```

Terminal 2 (Celery Worker):
```bash
celery -A config worker -l info
```

Terminal 3 (Redis):
```bash
redis-server
```

**Option B: Production with Daphne (WebSocket Support)**

```bash
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

### 4. Docker Setup

```bash
# Build and run with Docker Compose
docker-compose up -d

# Run migrations in container
docker-compose exec web python manage.py migrate

# Create superuser in container
docker-compose exec web python manage.py createsuperuser
```

## API Testing

### Get Authentication Token

```bash
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'
```

### Create a Project

```bash
curl -X POST http://localhost:8000/api/versioning/projects/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Project",
    "description": "Project description"
  }'
```

### Upload a Creative Asset

```bash
curl -X POST http://localhost:8000/api/versioning/assets/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -F "project=1" \
  -F "name=My Asset" \
  -F "file_type=image" \
  -F "file=@/path/to/image.jpg"
```

### Create an Annotation

```bash
curl -X POST http://localhost:8000/api/annotations/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "version": 1,
    "annotation_type": "comment",
    "x_coordinate": 100.5,
    "y_coordinate": 200.5,
    "page_number": 1,
    "content": "This needs revision",
    "color": "#FF0000"
  }'
```

### Create a Workflow Template

```bash
curl -X POST http://localhost:8000/api/workflows/templates/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Standard Review",
    "description": "Internal review then client review"
  }'
```

## Admin Interface

Access at: `http://localhost:8000/admin/`

Use your superuser credentials to:
- Manage users and permissions
- Create workflow templates
- Configure notification preferences
- View all data models

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000
# Kill the process
kill -9 <PID>
```

### Redis Connection Error
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# If not running, start Redis
redis-server
```

### Database Locked Error
```bash
# Remove old database and recreate
rm db.sqlite3
python manage.py migrate
```

### WebSocket Connection Issues
- Ensure you're using Daphne, not Django dev server
- Check CORS settings match your frontend domain
- Verify Redis is running for channel layer

## Next Steps

1. Create a React frontend application
2. Implement file upload UI with progress tracking
3. Build annotation canvas interface
4. Create workflow management dashboard
5. Implement real-time notification UI
6. Add user authentication and profile management
