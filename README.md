# White Lab Website

Производственный сайт White Lab с панелью управления контентом и медиа.

## Что есть в проекте

- редактируемая панель управления (`/admin`)
- страницы услуг (`/services/:slug`)
- SEO-мета, OpenGraph и JSON-LD
- `robots.txt` и `sitemap.xml`
- локальная медиатека с автооптимизацией

## TypeScript-архитектура

Основной исходный код хранится в `src/**/*.ts`:

- `src/server.ts` — сервер и роуты
- `src/lib/*.ts` — работа с контентом и медиа
- `src/public/scripts/**/*.ts` — клиентские скрипты
- `src/tests/*.ts` — интеграционные тесты

Сборка выполняется скриптом `scripts/build-ts.mjs` (через встроенный `node:module stripTypeScriptTypes`) и генерирует JS-файлы в `dist/` и `public/scripts/`.

## Запуск

```bash
npm install
npm run build
npm start
```

Быстрый запуск с автосборкой:

```bash
npm run start:build
```

Сервер: `http://localhost:3000`

## Админка

Логин по умолчанию:

- имя пользователя: `admin`
- пароль: `white-lab-admin`

Для продакшена задайте переменные окружения:

```bash
export ADMIN_USERNAME="your_login"
export ADMIN_PASSWORD="your_password"
export SESSION_SECRET="your_session_secret"
export SITE_URL="https://your-domain.com"
```

## Синхронизация медиа

```bash
npm run media:sync
```

Результат сохраняется в:

- `public/media/source`
- `public/media/optimized`
- `content/media.json`
# whitelabdent
