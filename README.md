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
# Отредактируйте web\.env.local: NEXT_PUBLIC_API_URL=http://localhost:4000
npm run db:push -w api
npm run dev
```

- Веб: http://localhost:3000  
- API: http://localhost:4000/health  

---

## Публикация в интернет (рекомендуется Render)

Приложение состоит из **двух частей**: фронтенд (Next.js) и API (Express + Socket.IO).

**Проще всего:** подключите репозиторий к [Render](https://render.com) — в корне есть `render.yaml` (сервисы `glassnet-api` и `glassnet-web`). После деплоя укажите `CORS_ORIGIN` = URL фронтенда.

**Альтернатива — GitHub Pages** только для статики; API всё равно на Render. Статический экспорт с динамическими маршрутами ограничен — для полного функционала используйте Render/Vercel для веб-части.

### Шаг 1 — Репозиторий на GitHub

```powershell
cd d:\NewProject
git init
git add .
git commit -m "GlassNet release 1.0"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/glassnet.git
git push -u origin main
```

В настройках репозитория: **Settings → Pages → Build and deployment → GitHub Actions**.

### Шаг 2 — API на Render

1. Подключите репозиторий в Render → **New Web Service** → корень `api` (или используйте `render.yaml` в корне).
2. Задайте переменные (см. `.env.example`).
3. `CORS_ORIGIN` = URL вашего GitHub Pages, например `https://ВАШ_ЛОГИН.github.io`.
4. Скопируйте URL API, например `https://glassnet-api.onrender.com`.

### Шаг 3 — Секрет для GitHub Actions

**Settings → Secrets → Actions** → `NEXT_PUBLIC_API_URL` = URL API из шага 2.

После push в `main` workflow `.github/workflows/deploy-pages.yml` соберёт сайт и опубликует на:

`https://ВАШ_ЛОГИН.github.io/glassnet/` (если репозиторий не `username.github.io`, добавьте в `web/next.config.ts` `basePath: '/glassnet'`).

### HTTPS и звонки

Голосовые комнаты и демонстрация экрана работают только по **HTTPS** (GitHub Pages и Render дают HTTPS автоматически).

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

Обязательно новые секреты: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `MESSAGE_ENCRYPTION_KEY` (64 hex), `CORS_ORIGIN`, PostgreSQL для `DATABASE_URL` на проде.

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
