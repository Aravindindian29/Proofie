---
description: How to restart the Proofie application (backend + frontend)
---

# Restart Proofie Application

This workflow restarts both the Django backend and React frontend servers for the Proofie application.

## Prerequisites

- Python virtual environment activated (at `e:\Proofie\venv`)
- Node.js and npm installed

## Steps

1. **Stop any running servers**
   - Check for existing Django server on port 8000
   - Check for existing Vite/React server on port 3000/3001

2. **Start the Django backend server** // turbo
   ```powershell
   python manage.py runserver 8000
   ```
   - Working directory: `e:\Proofie`
   - Wait for "Starting development server at http://127.0.0.1:8000/"

3. **Start the React frontend server** // turbo
   ```powershell
   npm run dev
   ```
   - Working directory: `e:\Proofie\frontend`
   - Note the port (usually 3000 or 3001 if 3000 is in use)

4. **Verify both servers are running**
   - Backend: http://localhost:8000
   - Frontend: http://localhost:3000 (or displayed port)

5. **Login credentials (if needed)**
   - Username: `Admin`
   - Password: `Chennai@1234`
