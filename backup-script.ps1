# Shuttlestats App Backup Script
# Run this script to create a complete backup of your project

Write-Host "Creating backup for Shuttlestats App..." -ForegroundColor Green

# Get current directory
$projectDir = Get-Location

# Create backup name with timestamp
$backupName = "shuttlestats-backup-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
$backupPath = "C:\Users\User\OneDrive\Documents\coding\$backupName.zip"

# Check for uncommitted changes
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "Found uncommitted changes. Committing them first..." -ForegroundColor Yellow
    git add .
    git commit -m "Auto backup commit - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Blue
git push origin main

# Create local ZIP backup
Write-Host "Creating local ZIP backup..." -ForegroundColor Blue
Compress-Archive -Path "$projectDir\*" -DestinationPath $backupPath -Force

# Verify backup
if (Test-Path $backupPath) {
    $backupSize = (Get-Item $backupPath).Length / 1KB
    Write-Host "✅ Backup completed successfully!" -ForegroundColor Green
    Write-Host "📁 Location: $backupPath" -ForegroundColor Cyan
    Write-Host "📊 Size: $([math]::Round($backupSize, 2)) KB" -ForegroundColor Cyan
    Write-Host "🌐 GitHub: https://github.com/JerbyCalo/shuttlestats-app" -ForegroundColor Cyan
} else {
    Write-Host "❌ Backup failed!" -ForegroundColor Red
}

Write-Host "`nBackup process completed!" -ForegroundColor Green
