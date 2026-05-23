# Деплой на Vercel

Сайт + API на одном домене (`/backend`). База — **SQLite-файл в GitHub** (`api/prisma/glassnet.db`), без Supabase.

## Переменные Vercel (Production)

| Переменная | Значение |
|------------|----------|
| `JWT_SECRET` | случайная строка ≥32 символов |
| `JWT_REFRESH_SECRET` | другая строка ≥32 символов |
| `MESSAGE_ENCRYPTION_KEY` | длинная случайная строка ≥32 |
| `NODE_ENV` | `production` |

**Удалите**, если были: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_API_URL`.

## Deployment Protection (важно для логина)

Если URL вида `glassnet-xxxxx-hoomeees-projects.vercel.app` — это **preview** с защитой Vercel.

**Симптом:** логин/регистрация не работают, в Network — `401` или HTML «Authentication Required» на `/backend/*`.

**Решение (одно из):**

1. **Project Settings → Deployment Protection** → отключить для Production (или для Preview).
2. Открывать **Production**-домен (`glassnet.vercel.app` или ваш alias), не preview-ссылку.
3. В **Settings → Domains** назначить production и пользоваться им.

---

## Когда делать Redeploy

1. **Сейчас** — после `git push` с новым кодом и `glassnet.db`.
2. **Потом** — когда обновили `glassnet.db` в репозитории или меняли схему Prisma.

## Шаги

1. Закоммитьте и запушьте изменения (включая `api/prisma/glassnet.db`).
2. Vercel → **Deployments** → **Redeploy** (или дождитесь автодеплоя после push).
3. Проверка: `https://ВАШ-ПРОЕКТ.vercel.app/backend/health` → `"db":true`.

## Локально

```powershell
copy .env.example api\.env
copy .env.example web\.env.local
npm install
npm run dev
```

Подробнее про БД: **[DATABASE.md](DATABASE.md)**
