# GlassNet — релиз 1.0

Соцсеть в стиле **Liquid Glass**: лента, опросы, голосовые посты, зашифрованные ЛС, голосовые комнаты (как Discord) с демонстрацией экрана и WebRTC (DTLS-SRTP).

---

## Возможности

| Раздел | Описание |
|--------|----------|
| **Лента** | Посты, лайки, комментарии, репосты, фото |
| **Публикация** | Текст, фото, **голосовые**, **опросы** (2–4 варианта) |
| **Обзор** | Популярные пользователи + кнопка **«Перемешать»** |
| **ЛС** | AES-256-GCM; кнопка «Написать» открывает существующий чат или создаёт новый |
| **Голос** | Комнаты, микрофон, заглушка, **демонстрация экрана**, сигналинг через Socket.IO |
| **Кланы** | Создание и вступление |

---

## Быстрый старт (локально)

```powershell
cd d:\NewProject
npm install
copy .env.example api\.env
copy .env.example web\.env.local
npm run dev
```

- Веб: http://localhost:3000  
- API: http://localhost:4000/health  
- База: **`api/prisma/glassnet.db`** (файл в репозитории)

---

## Публикация (Vercel + БД в GitHub)

База — **SQLite** в репозитории, без Supabase. Инструкции:

- **[docs/VERCEL.md](docs/VERCEL.md)** — деплой и **когда делать Redeploy**
- **[docs/DATABASE.md](docs/DATABASE.md)** — как обновлять `glassnet.db`

Кратко:

1. [vercel.com](https://vercel.com) → проект, **Root Directory: `web`**
2. Секреты: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `MESSAGE_ENCRYPTION_KEY`, `NODE_ENV=production`
3. `git push` (с файлом `api/prisma/glassnet.db`) → **Redeploy**
4. Проверка: `/backend/health` → `"db":true`

---

## Структура

```
api/
  prisma/
    schema.prisma
    glassnet.db          ← база в GitHub
  src/routes/
web/
  src/app/(app)/
```

---

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | API + Web |
| `npm run build` | Production build |
| `npm run db:migrate:dev -w api` | Новая миграция после правки schema |
| `npm run db:studio -w api` | Prisma Studio |

---

## Безопасность

- ЛС шифруются AES-256-GCM (`MESSAGE_ENCRYPTION_KEY`).
- WebRTC: **DTLS-SRTP** между браузерами.
- Helmet, rate limit, валидация env в production.

---

## Лицензия

MIT
