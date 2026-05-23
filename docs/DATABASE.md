# База данных в репозитории (SQLite)

Файл **`api/prisma/glassnet.db`** хранится в GitHub и едет вместе с кодом на Vercel.  
Отдельный Supabase / Postgres **не нужен**.

## Локально

```powershell
cd d:\NewProject
copy .env.example api\.env
copy .env.example web\.env.local
npm install
npm run dev
```

Данные пишутся в `api/prisma/glassnet.db`.

## Обновить данные на проде (Vercel)

1. Поработайте локально (регистрация, посты и т.д.).
2. Закоммитьте файл БД:
   ```powershell
   git add api/prisma/glassnet.db
   git commit -m "Update database snapshot"
   git push
   ```
3. **Redeploy** на Vercel (см. ниже).

На Vercel при старте копия `glassnet.db` из репозитория попадает в `/tmp` — оттуда идут запросы.  
**Новые данные, созданные только на сайте в проде, не попадут в GitHub** — для «эталонной» базы обновляйте файл локально и пушьте.

## Vercel — переменные

| Переменная | Нужна? |
|------------|--------|
| `JWT_SECRET` | да (≥32 символов) |
| `JWT_REFRESH_SECRET` | да |
| `MESSAGE_ENCRYPTION_KEY` | да (≥32 символов) |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | **нет** |
| `DIRECT_URL` | **нет** (удалите, если были) |

## Проверка

`https://ВАШ-ПРОЕКТ.vercel.app/backend/health` → `{"ok":true,"db":true,...}`

## Схема (миграции)

После правки `schema.prisma`:

```powershell
npm run db:migrate:dev -w api
git add api/prisma/migrations api/prisma/glassnet.db
git push
```

Затем Redeploy на Vercel.

## Prisma Studio

```powershell
npm run db:studio -w api
```
