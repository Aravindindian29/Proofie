---
description: How to deploy the Proofie application (backend + frontend) to production
---

# Proofie Deployment Workflow

This guide covers deploying the Proofie application (Django backend + React frontend) to production.

## Prerequisites

- Access to the production server
- Docker and Docker Compose installed on the server
- Environment variables configured (.env file)
- SSL certificates (if using HTTPS)

## Pre-Deployment Checklist

// turbo
1. Pull latest changes from the repository
2. Ensure all tests pass
3. Verify environment variables are set correctly
4. Check database migrations are compatible

## Backend Deployment (Django)

// turbo
1. Build the Docker image for the backend:
   ```bash
   docker-compose build
   ```

// turbo
2. Run database migrations:
   ```bash
   docker-compose run --rm web python manage.py migrate
   ```

// turbo
3. Collect static files:
   ```bash
   docker-compose run --rm web python manage.py collectstatic --noinput
   ```

// turbo
4. Restart the backend container:
   ```bash
   docker-compose up -d
   ```

## Frontend Deployment (React)

// turbo
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

// turbo
2. Install dependencies:
   ```bash
   npm ci
   ```

// turbo
3. Build the production bundle:
   ```bash
   npm run build
   ```

// turbo
4. Deploy the dist folder to the web server or CDN

## Post-Deployment Verification

5. Verify backend health endpoint:
   ```bash
   curl https://your-domain.com/api/health/
   ```

6. Verify frontend loads correctly in browser

7. Check application logs for any errors:
   ```bash
   docker-compose logs -f
   ```

## Rollback (if needed)

If issues are detected:

1. Stop the current containers:
   ```bash
   docker-compose down
   ```

2. Revert to previous Git commit

3. Re-deploy using the steps above

## Troubleshooting

- **Database connection issues**: Check DATABASE_URL in .env
- **Static files not loading**: Verify collectstatic ran successfully
- **CORS errors**: Ensure CORS_ALLOWED_ORIGINS includes the frontend domain
- **Container won't start**: Check logs with `docker-compose logs web`
