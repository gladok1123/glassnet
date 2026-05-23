# Бесплатная база данных (PostgreSQL)

GlassNet нужен **PostgreSQL**. Neon в РФ часто недоступен. Ниже — **бесплатные** варианты.

## Рекомендуем: Supabase Free

Бесплатно: ~500 МБ, подходит для Vercel, есть pooler для serverless.

1. [supabase.com](https://supabase.com) → **Start your project** (регистрация через GitHub).
2. **New project** → регион **Frankfurt** или **Stockholm** (ближе к EU).
3. Дождитесь создания → **Project Settings** → **Database**.

Скопируйте две строки:

| Переменная в Vercel | Где взять в Supabase |
|---------------------|----------------------|
| `DATABASE_URL` | **Connection string** → вкладка **URI** → режим **Transaction** (порт **6543**). В конец добавьте `?pgbouncer=true` |
| `DIRECT_URL` | **Connection string** → **URI** → режим **Session** (порт **5432**) |

Пример `DATABASE_URL` (подставьте свой пароль и хост):

```text
postgresql://postgres.xxxx:ВАШ_ПАРОЛЬ@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

Пример `DIRECT_URL`:

```text
postgresql://postgres.xxxx:ВАШ_ПАРОЛЬ@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

4. Vercel → **Settings → Environment Variables** → вставьте обе → **Redeploy**.

Если сайт не открывается в браузере — зайдите в Supabase через VPN один раз; **Vercel к базе подключается сам**, это важно только для настройки.

---

## Запасной вариант: ElephantSQL (Tiny Turtle)

Бесплатно **20 МБ** — хватит для теста и небольшого проекта.

1. [elephantsql.com](https://www.elephantsql.com) → **Get a managed database today** → план **Tiny Turtle (Free)**.
2. Создайте инстанс → вкладка **Details** → **URL**.

В Vercel:

| Переменная | Значение |
|------------|----------|
| `DATABASE_URL` | URL из ElephantSQL |
| `DIRECT_URL` | **тот же URL** |

---

## Локально (бесплатно, без облака)

```powershell
docker compose up -d
copy .env.example api\.env
copy .env.example web\.env.local
npm run db:push -w api
npm run dev
```

`DATABASE_URL` и `DIRECT_URL` — как в `.env.example` (`localhost:5432`).

---

## Платно / РФ-хостинг (если нужен свой сервер)

[Timeweb Cloud](https://timeweb.cloud) PostgreSQL — от ~200 ₽/мес, удобно из РФ.  
`DATABASE_URL` и `DIRECT_URL` — **одна и та же** строка подключения.

---

## Перенос со старой базы (Neon и др.)

```powershell
$env:NEON_DATABASE_URL = "старая строка"
$env:NEW_DATABASE_URL  = "новая строка (Supabase/ElephantSQL)"
.\scripts\db-migrate.ps1
```

Если база была пустая — просто новые URL на Vercel и **Redeploy**.

---

## Проверка

После деплоя:

- `https://ВАШ-ПРОЕКТ.vercel.app/backend/health` → `{"ok":true,...}`
- Регистрация на сайте без таймаута 30 с
