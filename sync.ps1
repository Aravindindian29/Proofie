# Quick Sync Script - Run after git pull to sync dependencies
# This is faster than full setup.ps1

Write-Host "🔄 Syncing dependencies..." -ForegroundColor Cyan

# Activate virtual environment
& .\venv\Scripts\Activate.ps1

# Check if requirements.txt changed in last commit
$reqChanged = git diff HEAD~1 HEAD --name-only | Select-String "requirements.txt"
$pkgChanged = git diff HEAD~1 HEAD --name-only | Select-String "frontend/package.json"

if ($reqChanged) {
    Write-Host "📦 Updating Python dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt --quiet
    Write-Host "✅ Python dependencies updated!" -ForegroundColor Green
    
    # Run migrations if models changed
    $modelsChanged = git diff HEAD~1 HEAD --name-only | Select-String "models.py"
    if ($modelsChanged) {
        Write-Host "🗄️  Running migrations..." -ForegroundColor Yellow
        python manage.py migrate
        Write-Host "✅ Migrations complete!" -ForegroundColor Green
    }
} else {
    Write-Host "✅ Python dependencies up to date" -ForegroundColor Green
}

if ($pkgChanged) {
    Write-Host "📦 Updating frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install --silent
    Set-Location ..
    Write-Host "✅ Frontend dependencies updated!" -ForegroundColor Green
} else {
    Write-Host "✅ Frontend dependencies up to date" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Sync complete!" -ForegroundColor Green
Write-Host ""
