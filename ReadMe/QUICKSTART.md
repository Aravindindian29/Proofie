# Proofie Quick Start Guide

## Prerequisites

- Python 3.10+
- Node.js 16+
- PostgreSQL 12+ (optional, SQLite for development)
- Redis 6+ (for real-time features)

## 5-Minute Setup

### 1. Backend Setup

```bash
# Navigate to project root
cd Proofie

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

Backend will be available at: `http://localhost:8000`
Admin panel: `http://localhost:8000/admin/`

### 2. Frontend Setup

```bash
# In a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:3000`

### 3. Start Redis (for real-time features)

```bash
# In a new terminal
redis-server
```

### 4. Start Celery Worker (for background tasks)

```bash
# In a new terminal
celery -A config worker -l info
```

## First Steps

1. **Login**: Navigate to `http://localhost:3000/login`
   - Use the superuser credentials you created

2. **Create a Project**: Click "New Project" on the Projects page

3. **Upload an Asset**: 
   - Go to your project
   - Click "Upload Asset"
   - Select a file (image, PDF, or video)

4. **Create an Annotation**:
   - Click on an asset
   - Click "Add Annotation"
   - Enter coordinates and comment

5. **Create a Workflow**:
   - Go to Workflows
   - Create a workflow template
   - Start a review cycle on an asset

## API Testing

### Get Token

```bash
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'
```

### Create Project

```bash
curl -X POST http://localhost:8000/api/versioning/projects/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Project", "description": "Test project"}'
```

### Upload Asset

```bash
curl -X POST http://localhost:8000/api/versioning/assets/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -F "project=1" \
  -F "name=My Image" \
  -F "file_type=image" \
  -F "file=@/path/to/image.jpg"
```

## Docker Setup

```bash
# Build and start all services
docker-compose up -d

# Run migrations
docker-compose exec web python manage.py migrate

# Create superuser
docker-compose exec web python manage.py createsuperuser

# View logs
docker-compose logs -f web
```

Services will be available at:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Admin: `http://localhost:8000/admin/`

## Common Tasks

### Create Admin User

```bash
python manage.py createsuperuser
```

### Reset Database

```bash
# Remove old database
rm db.sqlite3

# Run migrations
python manage.py migrate
```

### Create Test Data

```bash
python manage.py shell
```

```python
from django.contrib.auth.models import User
from apps.versioning.models import Project

# Create user
user = User.objects.create_user(username='testuser', password='testpass')

# Create project
project = Project.objects.create(name='Test Project', owner=user)
```

### View Database

```bash
# SQLite
sqlite3 db.sqlite3

# PostgreSQL
psql -U proofie -d proofie
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000
# Kill process
kill -9 <PID>
```

### Redis Connection Error

```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Start Redis if not running
redis-server
```

### Database Locked

```bash
# Remove database and recreate
rm db.sqlite3
python manage.py migrate
```

### WebSocket Connection Issues

- Ensure Redis is running
- Check CORS settings in `config/settings.py`
- Verify WebSocket URL in frontend

### Module Not Found

```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

## Environment Variables

Create `.env` file in project root:

```
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

DATABASE_URL=sqlite:///db.sqlite3
REDIS_URL=redis://localhost:6379/0

EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

## Next Steps

1. Read [ARCHITECTURE.md](ARCHITECTURE.md) for system design
2. Read [README.md](README.md) for detailed documentation
3. Explore the admin panel at `http://localhost:8000/admin/`
4. Check out the API at `http://localhost:8000/api/`
5. Review the frontend code in `frontend/src/`

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the documentation
3. Check Django and React logs
4. Verify all services are running (Django, Redis, Celery)

## Performance Tips

1. **Use PostgreSQL** in production instead of SQLite
2. **Enable Redis caching** for better performance
3. **Run Celery worker** for background tasks
4. **Use Daphne** instead of Django dev server for WebSockets
5. **Enable gzip compression** in production
6. **Use CDN** for static files and media

## Security Checklist

- [ ] Change `SECRET_KEY` in production
- [ ] Set `DEBUG=False` in production
- [ ] Configure `ALLOWED_HOSTS` properly
- [ ] Use HTTPS in production
- [ ] Set strong database password
- [ ] Configure CORS for your domain
- [ ] Use environment variables for secrets
- [ ] Enable CSRF protection
- [ ] Set secure cookie flags
