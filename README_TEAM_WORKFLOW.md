# 🤝 Team Collaboration Workflow

## Problem Solved
**Issue**: Team members pulling code but missing dependencies (PyMuPDF, Pillow, etc.) causing features to break locally.

**Solution**: Automated dependency management using git hooks + setup scripts.

---

## ✅ Solution Overview

### 1. **Automated Git Hooks** (Recommended)
Git automatically checks and installs dependencies after `git pull`.

### 2. **Setup Scripts**
One-time setup for new team members.

### 3. **Sync Scripts**
Manual dependency sync when needed.

---

## 🚀 For New Team Members

### First Time Setup
```powershell
# Clone repo
git clone <repo-url>
cd Proofie

# Run setup (one time only)
.\setup.ps1
```

**What it does**:
- Creates virtual environment
- Installs all Python dependencies (including PyMuPDF for thumbnails)
- Installs all frontend dependencies
- Runs database migrations
- Generates thumbnails for existing files
- Sets up git hooks for auto-dependency management

**Time**: ~5-10 minutes

---

## 🔄 Daily Workflow

### After Git Pull (Automatic)
```powershell
git pull
```

**What happens automatically**:
- If `requirements.txt` changed → Python deps auto-install
- If `package.json` changed → Node deps auto-install
- You see confirmation messages

### Manual Sync (If Needed)
```powershell
git pull
.\sync.ps1
```

Use this if:
- Git hooks didn't run
- You see "module not found" errors
- You want to force dependency check

---

## 📦 How It Works

### Git Hook: `.git/hooks/post-merge`
```bash
# Automatically runs after git pull/merge
# Checks if dependency files changed
# Installs only what's needed
```

**Key Point**: This file is in `.git/hooks/` which is **not tracked by git**. That's why each team member needs to run `setup.ps1` once.

### Dependencies Tracked
- `requirements.txt` → Python packages
- `frontend/package.json` → Node packages

When these files change in a commit, the hook auto-installs updates.

---

## 🎯 Benefits

### ✅ Before (Manual)
```
Team Member 1: *adds PyMuPDF*
Team Member 2: *pulls code*
Team Member 2: "Why aren't thumbnails working?"
Team Member 1: "Did you install PyMuPDF?"
Team Member 2: "What's that? How?"
*30 minutes of debugging*
```

### ✅ After (Automated)
```
Team Member 1: *adds PyMuPDF, commits requirements.txt*
Team Member 2: *git pull*
Git Hook: "📦 requirements.txt changed - updating dependencies..."
Git Hook: "✅ Python dependencies updated!"
Team Member 2: *thumbnails work immediately*
```

---

## 🔧 Adding New Dependencies

### Python Package
```powershell
# Activate venv
.\venv\Scripts\Activate.ps1

# Install package
pip install package-name

# Update requirements.txt
pip freeze > requirements.txt

# Commit and push
git add requirements.txt
git commit -m "Add package-name for feature X"
git push
```

**Result**: Team members auto-install on next pull! ✅

### Frontend Package
```powershell
cd frontend
npm install package-name

# package.json auto-updates
git add package.json package-lock.json
git commit -m "Add package-name for feature Y"
git push
```

**Result**: Team members auto-install on next pull! ✅

---

## 🐛 Troubleshooting

### "PDF thumbnails not showing"
```powershell
.\venv\Scripts\Activate.ps1
pip install PyMuPDF
python manage.py fix_thumbnails
```

### "Module not found" after pull
```powershell
.\sync.ps1
```

### Git hook not working
```powershell
# Re-run setup to restore hook
.\setup.ps1
```

### Everything is broken
```powershell
# Nuclear option - full reset
Remove-Item -Recurse -Force venv
Remove-Item -Recurse -Force frontend\node_modules
.\setup.ps1
```

---

## 📋 Files Created for Team Workflow

| File | Purpose | Tracked in Git? |
|------|---------|-----------------|
| `setup.ps1` | First-time setup | ✅ Yes |
| `sync.ps1` | Manual dependency sync | ✅ Yes |
| `.git/hooks/post-merge` | Auto-install on pull | ❌ No (local only) |
| `requirements.txt` | Python dependencies | ✅ Yes |
| `frontend/package.json` | Node dependencies | ✅ Yes |
| `TEAM_SETUP.md` | Full team guide | ✅ Yes |
| `README_TEAM_WORKFLOW.md` | This file | ✅ Yes |

---

## 🎓 Best Practices

### ✅ DO:
- Run `setup.ps1` when first cloning
- Commit dependency files when adding packages
- Let git hooks handle updates automatically
- Run `sync.ps1` if you see errors

### ❌ DON'T:
- Commit `venv/` or `node_modules/`
- Commit `.env` file
- Skip migrations after pulling model changes
- Manually install dependencies without updating requirements.txt

---

## 🚀 Quick Commands Reference

```powershell
# First time setup
.\setup.ps1

# After git pull (automatic)
git pull

# Manual sync
.\sync.ps1

# Start backend
python manage.py runserver

# Start frontend
cd frontend && npm run dev

# Fix thumbnails
python manage.py fix_thumbnails

# Run migrations
python manage.py migrate
```

---

## 💡 Why This Approach?

### Alternative Approaches Considered:

1. **Docker** - Too heavy for local development
2. **Manual README instructions** - People forget to check
3. **Pre-commit hooks** - Doesn't help with pulling changes
4. **CI/CD only** - Doesn't solve local development issues

### Our Approach:
- ✅ Lightweight (just PowerShell scripts)
- ✅ Automatic (git hooks)
- ✅ Fast (only updates what changed)
- ✅ Cross-platform compatible
- ✅ No additional tools needed

---

## 📞 Support

If you encounter issues:
1. Check `TEAM_SETUP.md` for detailed troubleshooting
2. Run `.\sync.ps1` to force dependency sync
3. Check console logs for specific errors
4. Ask team member who last modified the code

---

**Remember**: The goal is "git pull and it just works" ✨
