# Перенос PostgreSQL: Neon → новый хост (Timeweb / Supabase / свой VPS)
# Нужны: pg_dump и psql (PostgreSQL 16) или Docker.
$ErrorActionPreference = "Stop"

$from = $env:NEON_DATABASE_URL
$to = $env:NEW_DATABASE_URL

if (-not $from -or -not $to) {
  Write-Host "Задайте переменные:" -ForegroundColor Yellow
  Write-Host '  $env:NEON_DATABASE_URL = "postgresql://..."'
  Write-Host '  $env:NEW_DATABASE_URL  = "postgresql://..."'
  Write-Host ""
  Write-Host "Затем снова: .\scripts\db-migrate.ps1"
  exit 1
}

$dump = Join-Path $PSScriptRoot "..\glassnet-backup.sql"
Write-Host "Дамп из Neon -> $dump" -ForegroundColor Cyan
pg_dump $from --no-owner --no-acl -F p -f $dump
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Импорт в новую БД..." -ForegroundColor Cyan
psql $to -f $dump
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Готово. Обновите DATABASE_URL и DIRECT_URL на Vercel и сделайте Redeploy." -ForegroundColor Green
