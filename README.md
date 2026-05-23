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
docker compose up -d
npm install
copy .env.example api\.env
copy .env.example web\.env.local
npm run db:push -w api
npm run dev
```

- Веб: http://localhost:3000  
- API: http://localhost:4000/health  

---

## Публикация в интернет (Vercel + PostgreSQL)

**Рекомендуется для РФ:** [Vercel](https://vercel.com) + Postgres на **[Timeweb Cloud](https://timeweb.cloud)** (Neon в РФ часто заблокирован).

- Деплой: **[docs/VERCEL.md](docs/VERCEL.md)**
- База и перенос с Neon: **[docs/DATABASE.md](docs/DATABASE.md)**

Кратко:

1. Создайте PostgreSQL (Timeweb / Supabase), задайте `DATABASE_URL` и `DIRECT_URL`.
2. [vercel.com/new](https://vercel.com/new) → `glassnet` → **Root Directory: `web`**.
3. Секреты: `DATABASE_URL`, `DIRECT_URL`, `JWT_*`, `MESSAGE_ENCRYPTION_KEY`, `NODE_ENV=production`.
4. Deploy → `https://ваш-проект.vercel.app`.

Голосовые комнаты на Vercel используют REST-сигналинг (WebRTC); локально — Socket.IO.

### HTTPS и звонки

Микрофон и демонстрация экрана работают только по **HTTPS** (Vercel даёт автоматически).

---

## Как редактировать проект

### Структура

```
api/
  prisma/schema.prisma   — модели БД (посты, опросы, голосовые комнаты)
  src/routes/            — REST API
  src/socket.ts          — ЛС + сигналинг звонков
web/
  src/app/(app)/         — страницы приложения
  src/components/        — UI (PostCard, VoiceCallRoom, …)
  src/lib/api.ts         — все запросы к API
  src/app/globals.css    — стили, мобильная вёрстка
```

### Частые правки

| Задача | Файл |
|--------|------|
| Тексты кнопок / навигация | `web/src/components/glass/GlassNav.tsx` |
| Лента | `web/src/app/(app)/feed/page.tsx` |
| Создание поста (опрос/голос) | `web/src/app/(app)/compose/page.tsx` |
| Карточка поста | `web/src/components/PostCard.tsx`, `PollBlock.tsx` |
| Голосовые комнаты | `web/src/app/(app)/voice/`, `web/src/hooks/useVoiceCall.ts` |
| Логика API постов | `api/src/routes/posts.ts` |
| ЛС и открытие чата | `api/src/routes/messages.ts` |
| Цвета / glass-эффект | `web/src/app/globals.css` (`:root`) |
| Секреты и порты | `api/.env`, `web/.env.local` |

### База данных

После изменения `schema.prisma`:

```powershell
npm run db:push -w api
```

### Production-сборка

```powershell
npm run build
npm run start -w api
npm run start -w web
```

Обязательно: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `MESSAGE_ENCRYPTION_KEY`.

---

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | API + Web |
| `npm run build` | Production build |
| `npm run db:push -w api` | Применить схему БД |
| `npm run db:studio -w api` | Prisma Studio |

---

## Безопасность

- ЛС шифруются AES-256-GCM (`MESSAGE_ENCRYPTION_KEY`).
- Голосовой трафик: WebRTC с **DTLS-SRTP** (сквозное шифрование медиа между браузерами; сервер только пересылает SDP/ICE).
- Helmet, rate limit, валидация env в production.

---

## Лицензия

MIT — используйте и дорабатывайте свободно.
