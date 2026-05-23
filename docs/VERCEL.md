# Деплой на Vercel (работает из РФ)

Один домен: сайт + API (`/backend`). База — **Neon** (бесплатный Postgres).

## 1. База Neon

1. [neon.tech](https://neon.tech) → создайте проект → скопируйте **Connection string** (`postgresql://...`).

## 2. Vercel

1. [vercel.com/new](https://vercel.com/new) → Import **gladok1123/glassnet** (или ваш fork).
2. **Root Directory:** `web` **или** оставьте корень репозитория (`.`) — в репозитории есть оба `vercel.json`.
3. **Environment variables** (Production) — задайте **до** первого деплоя (без `DATABASE_URL` сборка упадёт на `prisma db push`):

| Переменная | Значение |
|------------|----------|
| `DATABASE_URL` | строка Neon (часто с `?sslmode=require` в конце) |
| `JWT_SECRET` | случайная строка ≥32 символов |
| `JWT_REFRESH_SECRET` | другая строка ≥32 символов |
| `MESSAGE_ENCRYPTION_KEY` | 64 hex-символа или длинная случайная строка |
| `NODE_ENV` | `production` |

`NEXT_PUBLIC_API_URL` **не задавайте** — фронт ходит на `/backend`.

4. **Deploy**.

## 3. Проверка

- `https://ВАШ-ПРОЕКТ.vercel.app` — регистрация, лента
- `https://ВАШ-ПРОЕКТ.vercel.app/backend/health` — `{"ok":true,...}`
- Голосовая комната — микрофон (HTTPS уже есть)

## Локально

```powershell
docker compose up -d
copy .env.example api\.env
copy .env.example web\.env.local
npm install
npm run db:push -w api
npm run dev
```

## Ограничения Vercel

- Загруженные картинки на serverless могут пропадать после холодного старта (в `/tmp`).
- Для постоянных файлов подключите [Vercel Blob](https://vercel.com/docs/storage/vercel-blob).
