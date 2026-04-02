# Team Setup Script for Proofie
# Run this once when first cloning the repo or after major updates

Write-Host "🚀 Proofie - Team Setup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment exists
if (-Not (Test-Path "venv")) {
    Write-Host "📦 Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "✅ Virtual environment created!" -ForegroundColor Green
} else {
    Write-Host "✅ Virtual environment already exists" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "🔧 Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Install/Update Python dependencies
Write-Host "📦 Installing Python dependencies..." -ForegroundColor Yellow
pip install --upgrade pip --quiet
pip install -r requirements.txt

# Check critical dependencies
Write-Host ""
Write-Host "🔍 Verifying critical dependencies..." -ForegroundColor Yellow

# Check PyMuPDF
try {
    $pymupdf = python -c "import fitz; print(fitz.version)" 2>&1
    Write-Host "  ✅ PyMuPDF: $pymupdf" -ForegroundColor Green
} catch {
    Write-Host "  ❌ PyMuPDF not installed" -ForegroundColor Red
}

# Check Pillow
try {
    $pillow = python -c "import PIL; print(PIL.__version__)" 2>&1
    Write-Host "  ✅ Pillow: $pillow" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Pillow not installed" -ForegroundColor Red
}

# Check Django
try {
    $django = python -c "import django; print(django.get_version())" 2>&1
    Write-Host "  ✅ Django: $django" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Django not installed" -ForegroundColor Red
}

# Install frontend dependencies
Write-Host ""
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
Set-Location ..
Write-Host "✅ Frontend dependencies installed!" -ForegroundColor Green

# Setup git hooks
Write-Host ""
Write-Host "🔧 Setting up git hooks..." -ForegroundColor Yellow
if (Test-Path ".git\hooks\post-merge") {
    Write-Host "✅ Git hooks already configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  Git hook not found - will be created on next commit" -ForegroundColor Yellow
}

# Run migrations
Write-Host ""
Write-Host "🗄️  Running database migrations..." -ForegroundColor Yellow
python manage.py migrate

# Generate thumbnails for existing files
Write-Host ""
Write-Host "🖼️  Generating thumbnails for existing files..." -ForegroundColor Yellow
python manage.py fix_thumbnails

# Create .env if it doesn't exist
if (-Not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "⚠️  .env file not found" -ForegroundColor Yellow
    Write-Host "📝 Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✅ .env created - please update with your settings" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Update .env with your settings (if needed)" -ForegroundColor White
Write-Host "  2. Start backend: python manage.py runserver" -ForegroundColor White
Write-Host "  3. Start frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: Run .\sync.ps1 anytime to sync dependencies after git pull" -ForegroundColor Yellow
Write-Host ""
