# 👥 Team Setup Guide - Proofie

## 🎯 Goal
Ensure all team members have the same dependencies and avoid "works on my machine" issues.

---

## 🚀 First Time Setup (New Team Member)

### Step 1: Clone Repository
```powershell
git clone <repo-url>
cd Proofie
```

### Step 2: Run Setup Script
```powershell
.\setup.ps1
```

This will:
- ✅ Create virtual environment
- ✅ Install Python dependencies (Django, PyMuPDF, Pillow, etc.)
- ✅ Install frontend dependencies (React, Vite, etc.)
- ✅ Run database migrations
- ✅ Generate thumbnails for existing files
- ✅ Create .env file from template
- ✅ Verify all critical dependencies

**Time**: ~5-10 minutes

---

## 🔄 Daily Workflow (After Git Pull)

### Option 1: Automatic (Recommended)
Git hooks will automatically check and install dependencies when you pull changes.

Just do:
```powershell
git pull
```

If `requirements.txt` or `package.json` changed, dependencies will auto-install.

### Option 2: Manual Sync
If you want to manually sync after pulling:
```powershell
git pull
.\sync.ps1
```

This is faster than full setup and only updates what changed.

---

## 📦 What's Included in Dependencies

### Python (requirements.txt)
- **Django** - Backend framework
- **djangorestframework** - REST API
- **PyMuPDF** - PDF thumbnail generation ⚠️ Critical for thumbnails
- **Pillow** - Image processing
- **django-cors-headers** - CORS handling
- **channels** - WebSocket support
- **python-decouple** - Environment variables

### Frontend (package.json)
- **React** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Axios** - HTTP client
- **React Router** - Routing
- **Lucide React** - Icons

---

## 🔧 Git Hooks (Automatic Dependency Management)

### What is a Git Hook?
A script that runs automatically after certain git commands.

### Our Hook: post-merge
**Location**: `.git/hooks/post-merge`

**Triggers**: After `git pull` or `git merge`

**Actions**:
1. Checks if `requirements.txt` changed → installs Python deps
2. Checks if `package.json` changed → installs Node deps
3. Shows success message

**Note**: The hook file is in `.git/hooks/` which is **not tracked by git**. Each team member needs to run `setup.ps1` once to get the hook.

---

## 🐛 Troubleshooting

### "PDF thumbnails not showing"
**Cause**: PyMuPDF not installed

**Fix**:
```powershell
.\venv\Scripts\Activate.ps1
pip install PyMuPDF
python manage.py fix_thumbnails
```

### "Module not found" errors
**Cause**: Dependencies out of sync

**Fix**:
```powershell
.\sync.ps1
```

### "Virtual environment not found"
**Cause**: Haven't run setup yet

**Fix**:
```powershell
.\setup.ps1
```

### Git hook not working
**Cause**: Hook file not executable or not present

**Fix**:
```powershell
# Re-run setup to restore hooks
.\setup.ps1
```

---

## 📋 Team Best Practices

### ✅ DO:
- Run `setup.ps1` when first cloning repo
- Run `sync.ps1` after pulling if you see errors
- Commit changes to `requirements.txt` when adding Python packages
- Commit changes to `package.json` when adding npm packages
- Test locally before pushing

### ❌ DON'T:
- Commit `venv/` folder (already in .gitignore)
- Commit `node_modules/` folder (already in .gitignore)
- Commit `.env` file (contains secrets)
- Skip running migrations after pulling model changes

---

## 🔄 Adding New Dependencies

### Python Package
```powershell
# Activate venv
.\venv\Scripts\Activate.ps1

# Install package
pip install package-name

# Update requirements.txt
pip freeze > requirements.txt

# Commit
git add requirements.txt
git commit -m "Add package-name dependency"
git push
```

**Team members will auto-install on next pull!**

### Frontend Package
```powershell
cd frontend

# Install package
npm install package-name

# Commit (package.json auto-updates)
git add package.json package-lock.json
git commit -m "Add package-name dependency"
git push
```

**Team members will auto-install on next pull!**

---

## 🎯 Quick Reference

| Command | When to Use |
|---------|-------------|
| `.\setup.ps1` | First time setup, major updates |
| `.\sync.ps1` | After git pull (manual) |
| `git pull` | Daily - hooks auto-sync |
| `python manage.py runserver` | Start backend |
| `cd frontend && npm run dev` | Start frontend |
| `python manage.py fix_thumbnails` | Fix missing thumbnails |
| `python manage.py migrate` | After model changes |

---

## 🚨 Emergency Reset

If everything is broken:

```powershell
# 1. Delete virtual environment
Remove-Item -Recurse -Force venv

# 2. Delete node_modules
Remove-Item -Recurse -Force frontend\node_modules

# 3. Re-run setup
.\setup.ps1

# 4. Restart servers
python manage.py runserver
cd frontend && npm run dev
```

---

## 📞 Need Help?

1. Check this guide first
2. Run `.\sync.ps1` to fix dependency issues
3. Check backend console for error messages
4. Check browser console (F12) for frontend errors
5. Ask team member who last modified the code

---

**Remember**: The goal is to make setup automatic so you can focus on coding, not configuration! 🚀
