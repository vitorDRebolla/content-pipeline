# Content Pipeline — Design Spec
_Portal Tela Fullstack Challenge_

## Overview

End-to-end pipeline that takes a public article URL, rewrites it using Generative AI, and publishes it to a WordPress site — all triggered by a single HTTP request.

---

## Components

### 1. Content Generation Service
**Stack:** Node.js + TypeScript + Express  
**Port:** 3000

**Endpoint:** `POST /api/generate-post`  
**Body:** `{ "url": "https://..." }`  
**Response:** `{ "success": true, "postId": 123, "postUrl": "https://..." }`

**Flow:**
1. Validate `url` param — reject if missing or not a valid URL
2. Axios GET to fetch the raw HTML of the URL
3. Cheerio extracts: `<title>` tag + all `<p>` tag text joined as plain text
4. Send extracted text to Gemini (`gemini-1.5-flash`) with a prompt to rewrite as a new article, returning structured JSON `{ title, content (HTML), excerpt }`
5. POST the payload to the WordPress plugin webhook with a shared secret token in the `Authorization` header
6. Return the post ID and URL from WordPress back to the caller

**Files:**
- `src/index.ts` — Express app bootstrap
- `src/routes/generate.ts` — route handler and orchestration
- `src/services/scraper.ts` — Axios + Cheerio URL extraction
- `src/services/gemini.ts` — Gemini API client and prompt
- `src/services/webhook.ts` — HTTP POST to WordPress

**Env vars:**
- `GEMINI_API_KEY`
- `WORDPRESS_WEBHOOK_URL` (e.g. `http://wordpress:8080/wp-json/content-pipeline/v1/publish`)
- `WEBHOOK_SECRET` (shared token between service and plugin)
- `PORT` (default 3000)

---

### 2. WordPress Plugin
**Language:** PHP  
**Name:** `content-pipeline`

**Registers:** `POST /wp-json/content-pipeline/v1/publish`

**Flow:**
1. Validate `Authorization: Bearer <WEBHOOK_SECRET>` header — return 401 if invalid
2. Parse JSON body: `{ title, content, excerpt, status }`
3. Call `wp_insert_post()` with the data
4. Return `{ postId, postUrl }` as JSON

**File:** `wordpress/plugins/content-pipeline/content-pipeline.php`

---

### 3. WordPress Theme
**Name:** `tela-theme`  
**Frontend:** Bootstrap 5 + SASS + Vite

**Build:**
- `npm run build` → Vite compiles `src/scss/main.scss` and `src/js/main.js` into `assets/`
- Bootstrap imported via SASS `@use` with variable overrides for brand color and typography
- `functions.php` enqueues compiled CSS and JS

**Theme files:**
- `style.css` — WordPress theme header
- `functions.php` — asset enqueue + theme setup
- `index.php` — fallback template
- `single.php` — main focus: clean single post layout
- `header.php` / `footer.php`
- `src/scss/main.scss` — Bootstrap import + customization
- `src/js/main.js` — minimal JS entry

**Single post layout:**
```
Header (site name + nav)
─────────────────────────
Category tag
Post title (h1)
Date · Estimated read time
─────────────────────────
Post body
  - max-width container for readability
  - comfortable line-height and paragraph spacing
  - responsive
─────────────────────────
Footer
```

---

### 4. Infrastructure

**docker-compose.yml services:**
- `service` — Node.js app, built from `service/Dockerfile`, port 3000
- `wordpress` — `wordpress:latest` image, port 8080, mounts plugin and theme folders
- `mysql` — `mysql:8`, internal only, credentials via env vars

**Startup:** `docker compose up --build`

WordPress mounts:
- `./wordpress/plugins/content-pipeline` → `/var/www/html/wp-content/plugins/content-pipeline`
- `./wordpress/themes/tela-theme` → `/var/www/html/wp-content/themes/tela-theme`

---

## Payload Schema

```json
{
  "title": "string",
  "content": "string (HTML)",
  "excerpt": "string",
  "status": "publish"
}
```

---

## Security

- Webhook protected by a shared `WEBHOOK_SECRET` token
- Secret stored in `.env` (not committed — `.env.example` committed instead)
- WordPress REST endpoint returns 401 for missing/invalid token

---

## Deliverables Checklist

- [ ] GitHub repo with all code
- [ ] `README.md` with architecture, setup steps, env vars
- [ ] Postman collection for `POST /api/generate-post`
- [ ] Invite `michel-portaltela` to the repo
