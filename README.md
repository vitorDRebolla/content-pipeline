# Content Pipeline

An end-to-end content generation and publishing pipeline. Send a public article URL, get a rewritten post published to WordPress — all in one request.

## Architecture

```
POST /api/generate-post { url }
         │
         ▼
 Content Service (Node.js + TypeScript)
  1. Scrapes the provided URL with Axios + Cheerio
  2. Rewrites the content using Google Gemini (gemini-3.1-flash-lite)
  3. POSTs the result to the WordPress plugin webhook
         │
         ▼
 WordPress Plugin (PHP)
  - Receives the payload and creates a new post via wp_insert_post()
         │
         ▼
 WordPress Theme (Bootstrap 5 + SASS + Vite)
  - Renders the post on a clean, responsive single post page
```

## Tech stack

- **Service:** Node.js 20, TypeScript, Express, Axios, Cheerio, @google/generative-ai
- **WordPress plugin:** PHP
- **WordPress theme:** Bootstrap 5, SASS, Vite
- **Infrastructure:** Docker Compose, MySQL 8

## Prerequisites

- Docker and Docker Compose
- A [Google Gemini API key](https://aistudio.google.com) (free tier)

## Setup

**1. Clone the repo and copy the env file:**

```bash
git clone <repo-url>
cd content-pipeline
cp .env.example .env
```

**2. Fill in `.env`:**

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Your Gemini API key from Google AI Studio |
| `GEMINI_MODEL` | Gemini model to use (default: `gemini-3.1-flash-lite`) |
| `WEBHOOK_SECRET` | A strong random secret shared between the service and the plugin — generate with `openssl rand -hex 32` |
| `WORDPRESS_WEBHOOK_URL` | Leave as-is for local Docker setup |
| `MYSQL_*` | Leave as-is or change to your preference |

**3. Start everything:**

```bash
docker compose up --build
```

**4. Complete the WordPress installer at `http://localhost:8080`**

Go through the setup wizard, then:
- **Plugins** → activate **Content Pipeline**
- **Appearance → Themes** → activate **Tela Theme**

## Usage

Send a POST request with a public article URL:

```bash
curl -X POST http://localhost:3000/api/generate-post \
  -H "Content-Type: application/json" \
  -d '{"url": "https://en.wikipedia.org/wiki/Artificial_intelligence"}'
```

Response:

```json
{
  "success": true,
  "postId": 1,
  "postUrl": "http://localhost:8080/?p=1"
}
```

Open the `postUrl` to see the published post rendered in the Tela theme.

## Theme development

```bash
cd wordpress/themes/tela-theme
npm install
npm run dev    # watch mode
npm run build  # production build
```

Bootstrap is a dev dependency imported via SASS `@use` — customize variables in `src/scss/main.scss` before the `@use "bootstrap/scss/bootstrap"` line.

## Screenshots

### Generated WordPress post
![Generated post](docs/screenshots/generated-post.png)

### Successful API request
![API response](docs/screenshots/api-success.png)

### WordPress admin — post created
![WordPress admin](docs/screenshots/wp-admin-post.png)

## Security notes

- The plugin endpoint is protected by a custom `X-Content-Pipeline-Secret` header validated with `hash_equals()` to prevent timing attacks
- `.env` is gitignored — never commit it
- Generate a strong secret with `openssl rand -hex 32`
- In production: use HTTPS, rotate the webhook secret, and add rate limiting to `/api/generate-post`
