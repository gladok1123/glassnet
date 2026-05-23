# База данных (без Neon)

GlassNet использует **PostgreSQL**. Neon в РФ часто недоступен — ниже варианты и перенос данных.

## Рекомендация для РФ: Timeweb Cloud

1. [timeweb.cloud](https://timeweb.cloud) → **Базы данных** → PostgreSQL.
2. Создайте кластер, откройте **публичный доступ** (или добавьте `0.0.0.0/0` в firewall для Vercel).
3. Скопируйте строку подключения, например:
   `postgresql://user:pass@host:5432/glassnet?sslmode=require`

В **Vercel → Environment Variables**:

| Переменная | Значение |
|------------|----------|
| `DATABASE_URL` | строка подключения |
| `DIRECT_URL` | **та же строка** (для Timeweb pooler не нужен) |

Локально в `api/.env` — те же значения или Docker:

```powershell
docker compose up -d
# DATABASE_URL=postgresql://glassnet:glassnet@localhost:5432/glassnet
# DIRECT_URL=postgresql://glassnet:glassnet@localhost:5432/glassnet
```

---

## Альтернатива: Supabase (EU)

1. [supabase.com](https://supabase.com) → проект → **Settings → Database**.
2. **Transaction pooler** (порт **6543**) → `DATABASE_URL` (добавьте `?pgbouncer=true`).
3. **Session mode** (порт **5432**) → `DIRECT_URL` (для `prisma db push` на Vercel).

---

## Перенос данных с Neon

Если на Neon уже есть пользователи/посты, сделайте дамп **через VPN** (один раз):

```powershell
# Установите PostgreSQL client (psql/pg_dump) или используйте Docker:
$neon = "postgresql://USER:PASS@ep-xxx.neon.tech/neondb?sslmode=require"
$new  = "postgresql://USER:PASS@HOST:5432/glassnet?sslmode=require"

docker run --rm -e PGPASSWORD=... postgres:16-alpine pg_dump $neon --no-owner --no-acl -f /tmp/dump.sql
docker run --rm -i postgres:16-alpine psql $new -f - < dump.sql
```

Проще с файлами:

```powershell
pg_dump "$env:NEON_DATABASE_URL" --no-owner --no-acl -F p -f glassnet-backup.sql
psql "$env:NEW_DATABASE_URL" -f glassnet-backup.sql
```

Если Neon пустой — просто задайте новый `DATABASE_URL` / `DIRECT_URL` на Vercel и **Redeploy**.

---

## После смены URL

1. Vercel → обновите `DATABASE_URL` и `DIRECT_URL`.
2. **Redeploy** (лучше с **Clear build cache**).
3. Проверка: `/backend/health` и регистрация на сайте.

Скрипт-подсказка: `scripts/db-migrate.ps1`
