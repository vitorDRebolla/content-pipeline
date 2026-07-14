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
git clone https://github.com/vitorDRebolla/content-pipeline.git
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
docker compose up --build -d
```

**4. Complete the WordPress installer at `http://localhost:8080`**

> If you see "Error establishing a database connection", MySQL is still initializing. Wait 10–15 seconds and run:
> ```bash
> docker compose restart wordpress
> ```
> Then refresh the page.

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

## Testing

```bash
cd service
npm test
```

The test suite covers input validation, the `/health` endpoint, and SSRF protection in the scraper. The services (Gemini, WordPress webhook) are mocked so no external connections are needed.

## Theme development

```bash
cd wordpress/themes/tela-theme
npm install
npm run dev    # watch mode
npm run build  # production build
```

Bootstrap is a dev dependency imported via SASS `@use` — customize variables in `src/scss/main.scss` before the `@use "bootstrap/scss/bootstrap"` line.

The compiled assets (`assets/css/main.css`, `assets/js/main.js`) are committed to the repo so the recruiter doesn't need to run a build step.

## Error responses

The service returns structured JSON for all errors:

```json
{ "success": false, "stage": "scraping", "error": "URL is not allowed" }
{ "success": false, "stage": "generation", "error": "Failed to generate content: ..." }
{ "success": false, "stage": "publishing", "error": "Failed to publish to WordPress: ..." }
```

The `stage` field tells you exactly where in the pipeline the failure occurred.

## Known limitations

- **Synchronous pipeline:** Scraping + generation + publishing all happen within a single HTTP request. Gemini can take 5–10 seconds on larger articles. For production use, this should be an async job queue (BullMQ + Redis).
- **JS-rendered pages:** Cheerio only parses static HTML. Pages that require JavaScript to render content won't be scraped correctly. Swap the scraper module for Puppeteer to handle those.
- **Rate limiting:** There's no per-IP rate limiting on the endpoint. In production, add `express-rate-limit` or handle it at the API gateway level.

## Security notes

- The plugin endpoint is protected by a custom `X-Content-Pipeline-Secret` header validated with `hash_equals()` to prevent timing attacks. The standard `Authorization` header is not used because Apache strips it by default in PHP setups.
- The scraper blocks requests to localhost, private IP ranges, and the AWS metadata endpoint (`169.254.169.254`) to prevent SSRF.
- `.env` is gitignored — never commit it.
- Generate a strong secret with `openssl rand -hex 32`.
- In production: use HTTPS, rotate the webhook secret quarterly, and add rate limiting to `/api/generate-post`.
