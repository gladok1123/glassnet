# Деплой на Vercel (работает из РФ)

Один домен: сайт + API (`/backend`). База — **бесплатный PostgreSQL** ([Supabase Free](https://supabase.com) или [ElephantSQL](https://www.elephantsql.com)).  
Подробнее: **[DATABASE.md](DATABASE.md)**

## 1. База данных (бесплатно)

1. Создайте **Supabase Free** (пошагово в **DATABASE.md**).
2. Скопируйте `DATABASE_URL` (pooler, порт 6543) и `DIRECT_URL` (session, порт 5432).

## 2. Vercel

1. [vercel.com/new](https://vercel.com/new) → Import **gladok1123/glassnet**.
2. **Root Directory:** `web`
3. **Environment variables** (Production):

| Переменная | Значение |
|------------|----------|
| `DATABASE_URL` | Postgres (pooler, если Supabase) |
| `DIRECT_URL` | Postgres (прямое подключение для миграций) |
| `JWT_SECRET` | случайная строка ≥32 символов |
| `JWT_REFRESH_SECRET` | другая строка ≥32 символов |
| `MESSAGE_ENCRYPTION_KEY` | длинная случайная строка |
| `NODE_ENV` | `production` |

`NEXT_PUBLIC_API_URL` **не задавайте**.

4. **Deploy** → проверьте `/backend/health` и регистрацию.

## Локально

```powershell
docker compose up -d
copy .env.example api\.env
# DIRECT_URL = тот же DATABASE_URL
copy .env.example web\.env.local
npm install
npm run db:push -w api
npm run dev
```
