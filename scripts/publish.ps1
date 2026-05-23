# Публикация GlassNet: GitHub + Render Blueprint
$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "=== GlassNet: публикация ===" -ForegroundColor Cyan

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Host "Установите GitHub CLI: winget install GitHub.cli" -ForegroundColor Red
  exit 1
}

$loggedIn = $false
try {
  gh auth status 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { $loggedIn = $true }
} catch { }

if (-not $loggedIn -and $env:GITHUB_TOKEN) {
  $env:GITHUB_TOKEN | gh auth login --with-token
  $loggedIn = $true
}

if (-not $loggedIn) {
  Write-Host ""
  Write-Host "Нужен вход в GitHub (один раз). Откроется браузер." -ForegroundColor Yellow
  gh auth login -h github.com -p https -w
}

$user = gh api user -q .login
if (-not $user) {
  Write-Host "Не удалось войти в GitHub." -ForegroundColor Red
  exit 1
}

$repoName = "glassnet"
git branch -M main 2>$null

if (git status --porcelain) {
  git add -A
  git -c user.email="$user@users.noreply.github.com" -c user.name=$user commit -m "GlassNet release 1.0" 2>$null
}

$exists = $false
try {
  gh repo view "$user/$repoName" 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { $exists = $true }
} catch { }

if (-not $exists) {
  gh repo create $repoName --public --source=. --remote=origin --push
} else {
  git push -u origin main
}

$repoUrl = "https://github.com/$user/$repoName"
$renderUrl = "https://render.com/deploy?repo=$([uri]::EscapeDataString($repoUrl))"

Write-Host ""
Write-Host "GitHub:  $repoUrl" -ForegroundColor Green
Write-Host "Render:  $renderUrl" -ForegroundColor Green
Write-Host ""
Write-Host "На Render нажмите Deploy Blueprint — через 5–10 мин сайт будет на *.onrender.com" -ForegroundColor Cyan

Start-Process $renderUrl
