# Публикация GlassNet: GitHub + ссылка на Render Blueprint
$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "=== GlassNet: публикация ===" -ForegroundColor Cyan

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Host "Установите GitHub CLI: winget install GitHub.cli" -ForegroundColor Red
  exit 1
}

$auth = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "Войдите в GitHub (откроется браузер):" -ForegroundColor Yellow
  gh auth login -h github.com -p https -w
}

$user = (gh api user -q .login)
$repoName = "glassnet"
$remote = "origin"

if (-not (git rev-parse HEAD 2>$null)) {
  git add -A
  git commit -m "GlassNet release 1.0"
} elseif (git status --porcelain) {
  git add -A
  git commit -m "GlassNet release 1.0"
}

$exists = gh repo view "$user/$repoName" 2>$null
if ($LASTEXITCODE -ne 0) {
  gh repo create $repoName --public --source=. --remote=$remote --push
} else {
  git branch -M main 2>$null
  git push -u $remote main
}

$repoUrl = "https://github.com/$user/$repoName"
$renderUrl = "https://render.com/deploy?repo=$repoUrl"

Write-Host ""
Write-Host "Репозиторий: $repoUrl" -ForegroundColor Green
Write-Host "Деплой на Render (один клик): $renderUrl" -ForegroundColor Green
Write-Host ""
Write-Host "После деплоя на Render откройте сервис glassnet-web — это ваш сайт." -ForegroundColor Cyan

Start-Process $renderUrl
