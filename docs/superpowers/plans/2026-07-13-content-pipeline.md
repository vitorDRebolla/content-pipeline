# Content Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an end-to-end AI content pipeline — POST a URL, get a rewritten article published to WordPress.

**Architecture:** A standalone Node.js/TypeScript Express service scrapes the URL, rewrites it with Gemini, and fires a webhook to a custom WordPress plugin. A Bootstrap 5 + Vite WordPress theme renders the post. Everything runs locally via Docker Compose.

**Tech Stack:** Node.js 20, TypeScript 5, Express 4, Axios, Cheerio, @google/generative-ai, PHP, WordPress (latest), MySQL 8, Bootstrap 5, SASS, Vite 5, Docker Compose

## Global Constraints

- Node.js ≥ 20
- TypeScript strict mode enabled
- Bootstrap 5 imported via SASS `@use` (not CDN)
- Vite 5 as the theme build tool
- All secrets live in `.env` — never committed; `.env.example` is committed
- WordPress plugin uses `wp_insert_post()` to create posts
- Shared `WEBHOOK_SECRET` protects the plugin endpoint (`Authorization: Bearer <secret>`)
- Docker Compose: service on port 3000, WordPress on port 8080
- After every task: stop and provide exact `git add` + `git commit` commands

---

### Task 1: Project root scaffolding

**Files:**
- Create: `.gitignore`
- Create: `.env.example`
- Create: `docker-compose.yml`

- [ ] **Step 1: Create `.gitignore`**

```
node_modules/
dist/
.env
*.log
.DS_Store
```

- [ ] **Step 2: Create `.env.example`**

```
GEMINI_API_KEY=your_gemini_api_key_here
WORDPRESS_WEBHOOK_URL=http://wordpress/wp-json/content-pipeline/v1/publish
WEBHOOK_SECRET=change_this_to_a_random_string
PORT=3000

MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=wordpress
MYSQL_USER=wpuser
MYSQL_PASSWORD=wppassword
```

- [ ] **Step 3: Create `.env` from the example (this file is gitignored)**

Copy `.env.example` to `.env` and fill in:
- `GEMINI_API_KEY` — your actual Gemini key
- `WEBHOOK_SECRET` — any random string (e.g. `pipeline_secret_123`)

- [ ] **Step 4: Create `docker-compose.yml`**

```yaml
services:
  service:
    build: ./service
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      - wordpress
    networks:
      - pipeline

  wordpress:
    image: wordpress:latest
    ports:
      - "8080:80"
    environment:
      WORDPRESS_DB_HOST: mysql
      WORDPRESS_DB_USER: ${MYSQL_USER}
      WORDPRESS_DB_PASSWORD: ${MYSQL_PASSWORD}
      WORDPRESS_DB_NAME: ${MYSQL_DATABASE}
      CONTENT_PIPELINE_SECRET: ${WEBHOOK_SECRET}
      WORDPRESS_CONFIG_EXTRA: "define('CONTENT_PIPELINE_SECRET', getenv('CONTENT_PIPELINE_SECRET'));"
    volumes:
      - ./wordpress/plugins/content-pipeline:/var/www/html/wp-content/plugins/content-pipeline
      - ./wordpress/themes/tela-theme:/var/www/html/wp-content/themes/tela-theme
      - wp_data:/var/www/html
    depends_on:
      - mysql
    networks:
      - pipeline

  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - pipeline

volumes:
  wp_data:
  mysql_data:

networks:
  pipeline:
    driver: bridge
```

- [ ] **Step 5: Verify structure**

```bash
ls -la
```

Expected: `.gitignore`, `.env.example`, `.env`, `docker-compose.yml`, `docs/`

- [ ] **Step 6: Commit**

```bash
git add .gitignore .env.example docker-compose.yml docs/
git commit -m "chore: project scaffolding — docker-compose, env, design docs"
```

---

### Task 2: Content service scaffolding

**Files:**
- Create: `service/package.json`
- Create: `service/tsconfig.json`
- Create: `service/Dockerfile`

- [ ] **Step 1: Create `service/package.json`**

```json
{
  "name": "content-pipeline-service",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "axios": "^1.7.0",
    "cheerio": "^1.0.0",
    "dotenv": "^16.4.0",
    "express": "^4.21.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.14.0",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 2: Create `service/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `service/Dockerfile`**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

- [ ] **Step 4: Install dependencies**

```bash
cd service && npm install
```

- [ ] **Step 5: Commit**

```bash
git add service/package.json service/package-lock.json service/tsconfig.json service/Dockerfile
git commit -m "chore: content service scaffolding"
```

---

### Task 3: Express app entry point

**Files:**
- Create: `service/src/index.ts`

- [ ] **Step 1: Create `service/src/index.ts`**

```typescript
import express from 'express'
import dotenv from 'dotenv'
import generateRoute from './routes/generate'

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use('/api', generateRoute)

app.listen(port, () => {
  console.log(`Service running on port ${port}`)
})

export default app
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd service && npm run build
```

Expected: `dist/` folder is created, no TypeScript errors (the route import will fail until Task 7 — that's fine, fix by creating a placeholder `src/routes/generate.ts` that just exports `Router()` if needed)

- [ ] **Step 3: Commit**

```bash
git add service/src/index.ts
git commit -m "feat: express app entry point"
```

---

### Task 4: Scraper service

**Files:**
- Create: `service/src/services/scraper.ts`

**Produces:** `scrapeUrl(url: string): Promise<{ title: string; text: string }>`

- [ ] **Step 1: Create `service/src/services/scraper.ts`**

```typescript
import axios from 'axios'
import * as cheerio from 'cheerio'

export interface ScrapedContent {
  title: string
  text: string
}

export async function scrapeUrl(url: string): Promise<ScrapedContent> {
  const { data } = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ContentBot/1.0)' },
    timeout: 10000,
  })

  const $ = cheerio.load(data)

  const title =
    $('h1').first().text().trim() ||
    $('title').first().text().trim()

  const paragraphs = $('p')
    .map((_: number, el: cheerio.Element) => $(el).text().trim())
    .get()
    .filter((p: string) => p.length > 50)
    .join('\n\n')

  return { title, text: paragraphs }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd service && npm run build 2>&1 | grep -i error || echo "no errors"
```

- [ ] **Step 3: Commit**

```bash
git add service/src/services/scraper.ts
git commit -m "feat: url scraper with axios and cheerio"
```

---

### Task 5: Gemini content generation service

**Files:**
- Create: `service/src/services/gemini.ts`

**Consumes:** `{ title: string; text: string }` from `scrapeUrl`
**Produces:** `generateContent(raw): Promise<GeneratedContent>` where `GeneratedContent = { title, content, excerpt, status }`

- [ ] **Step 1: Create `service/src/services/gemini.ts`**

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

export interface GeneratedContent {
  title: string
  content: string
  excerpt: string
  status: 'publish'
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

export async function generateContent(raw: { title: string; text: string }): Promise<GeneratedContent> {
  const prompt = `You are a content writer. Based on the article below, write a new, original article on the same topic.

Return ONLY valid JSON with no markdown, no code blocks, no extra text:
{
  "title": "your new title here",
  "content": "<p>HTML content with proper paragraph tags</p>",
  "excerpt": "a one-sentence summary of the article"
}

Original article:
Title: ${raw.title}
Body: ${raw.text.substring(0, 3000)}`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim().replace(/^```json\n?/, '').replace(/\n?```$/, '')

  const parsed = JSON.parse(text) as GeneratedContent
  parsed.status = 'publish'

  return parsed
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd service && npm run build 2>&1 | grep -i error || echo "no errors"
```

- [ ] **Step 3: Commit**

```bash
git add service/src/services/gemini.ts
git commit -m "feat: gemini content generation service"
```

---

### Task 6: WordPress webhook sender

**Files:**
- Create: `service/src/services/webhook.ts`

**Consumes:** `GeneratedContent` from `service/src/services/gemini.ts`
**Produces:** `publishToWordPress(content: GeneratedContent): Promise<{ id: number; link: string }>`

- [ ] **Step 1: Create `service/src/services/webhook.ts`**

```typescript
import axios from 'axios'
import { GeneratedContent } from './gemini'

export interface WordPressPost {
  id: number
  link: string
}

export async function publishToWordPress(content: GeneratedContent): Promise<WordPressPost> {
  const webhookUrl = process.env.WORDPRESS_WEBHOOK_URL
  const secret = process.env.WEBHOOK_SECRET

  const { data } = await axios.post<WordPressPost>(webhookUrl!, content, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    timeout: 15000,
  })

  return data
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd service && npm run build 2>&1 | grep -i error || echo "no errors"
```

- [ ] **Step 3: Commit**

```bash
git add service/src/services/webhook.ts
git commit -m "feat: wordpress webhook sender"
```

---

### Task 7: Generate route — wires everything together

**Files:**
- Create: `service/src/routes/generate.ts`

**Consumes:**
- `scrapeUrl` from `../services/scraper`
- `generateContent` from `../services/gemini`
- `publishToWordPress` from `../services/webhook`

- [ ] **Step 1: Create `service/src/routes/generate.ts`**

```typescript
import { Router, Request, Response } from 'express'
import { scrapeUrl } from '../services/scraper'
import { generateContent } from '../services/gemini'
import { publishToWordPress } from '../services/webhook'

const router = Router()

router.post('/generate-post', async (req: Request, res: Response) => {
  const { url } = req.body

  if (!url || !isValidUrl(url)) {
    res.status(400).json({ error: 'A valid URL is required' })
    return
  }

  try {
    const raw = await scrapeUrl(url)
    const generated = await generateContent(raw)
    const post = await publishToWordPress(generated)

    res.json({ success: true, postId: post.id, postUrl: post.link })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Something went wrong'
    console.error('[generate-post]', message)
    res.status(500).json({ error: message })
  }
})

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export default router
```

- [ ] **Step 2: Full build verification**

```bash
cd service && npm run build
```

Expected: `dist/` with `index.js`, `routes/generate.js`, `services/scraper.js`, `services/gemini.js`, `services/webhook.js` — no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add service/src/routes/generate.ts
git commit -m "feat: generate-post route — orchestrates scrape, generate, publish"
```

---

### Task 8: WordPress plugin

**Files:**
- Create: `wordpress/plugins/content-pipeline/content-pipeline.php`

- [ ] **Step 1: Create directory**

```bash
mkdir -p wordpress/plugins/content-pipeline
```

- [ ] **Step 2: Create `wordpress/plugins/content-pipeline/content-pipeline.php`**

```php
<?php
/**
 * Plugin Name: Content Pipeline
 * Description: Receives AI-generated content via webhook and publishes it as a WordPress post.
 * Version: 1.0.0
 * Author: Vitor Rebolla
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

add_action( 'rest_api_init', function () {
    register_rest_route( 'content-pipeline/v1', '/publish', [
        'methods'             => 'POST',
        'callback'            => 'cp_publish_post',
        'permission_callback' => '__return_true',
    ] );
} );

function cp_publish_post( WP_REST_Request $request ): WP_REST_Response {
    $auth     = $request->get_header( 'authorization' );
    $secret   = defined( 'CONTENT_PIPELINE_SECRET' ) ? CONTENT_PIPELINE_SECRET : '';
    $expected = 'Bearer ' . $secret;

    if ( empty( $secret ) || $auth !== $expected ) {
        return new WP_REST_Response( [ 'error' => 'Unauthorized' ], 401 );
    }

    $body    = $request->get_json_params();
    $title   = sanitize_text_field( $body['title'] ?? '' );
    $content = wp_kses_post( $body['content'] ?? '' );
    $excerpt = sanitize_text_field( $body['excerpt'] ?? '' );
    $status  = in_array( $body['status'] ?? '', [ 'publish', 'draft' ], true ) ? $body['status'] : 'publish';

    if ( empty( $title ) || empty( $content ) ) {
        return new WP_REST_Response( [ 'error' => 'Title and content are required' ], 400 );
    }

    $post_id = wp_insert_post( [
        'post_title'   => $title,
        'post_content' => $content,
        'post_excerpt' => $excerpt,
        'post_status'  => $status,
        'post_author'  => 1,
    ] );

    if ( is_wp_error( $post_id ) ) {
        return new WP_REST_Response( [ 'error' => $post_id->get_error_message() ], 500 );
    }

    return new WP_REST_Response( [
        'id'   => $post_id,
        'link' => get_permalink( $post_id ),
    ], 201 );
}
```

- [ ] **Step 3: Commit**

```bash
git add wordpress/plugins/content-pipeline/content-pipeline.php
git commit -m "feat: wordpress plugin — webhook endpoint to publish posts"
```

---

### Task 9: WordPress theme scaffolding

**Files:**
- Create: `wordpress/themes/tela-theme/style.css`
- Create: `wordpress/themes/tela-theme/package.json`
- Create: `wordpress/themes/tela-theme/vite.config.js`
- Create: `wordpress/themes/tela-theme/functions.php`

- [ ] **Step 1: Create `wordpress/themes/tela-theme/style.css`**

```css
/*
Theme Name: Tela Theme
Theme URI: https://github.com/vitorrebolla/content-pipeline
Author: Vitor Rebolla
Description: A clean WordPress theme for AI-generated content, built with Bootstrap 5.
Version: 1.0.0
*/
```

- [ ] **Step 2: Create `wordpress/themes/tela-theme/package.json`**

```json
{
  "name": "tela-theme",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build"
  },
  "devDependencies": {
    "bootstrap": "^5.3.3",
    "sass": "^1.77.8",
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 3: Create `wordpress/themes/tela-theme/vite.config.js`**

```javascript
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/js/main.js'),
      },
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name].js',
        assetFileNames: (info) => {
          if (info.name && info.name.endsWith('.css')) return 'css/[name][extname]'
          return '[name][extname]'
        },
      },
    },
    cssCodeSplit: false,
  },
})
```

- [ ] **Step 4: Create `wordpress/themes/tela-theme/functions.php`**

```php
<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

function tela_setup(): void {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'html5', [ 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption' ] );
}
add_action( 'after_setup_theme', 'tela_setup' );

function tela_enqueue_assets(): void {
    wp_enqueue_style(
        'tela-main',
        get_template_directory_uri() . '/assets/css/main.css',
        [],
        '1.0.0'
    );
    wp_enqueue_script(
        'tela-main',
        get_template_directory_uri() . '/assets/js/main.js',
        [],
        '1.0.0',
        true
    );
}
add_action( 'wp_enqueue_scripts', 'tela_enqueue_assets' );
```

- [ ] **Step 5: Install theme dependencies**

```bash
cd wordpress/themes/tela-theme && npm install
```

- [ ] **Step 6: Commit**

```bash
git add wordpress/themes/tela-theme/style.css wordpress/themes/tela-theme/package.json wordpress/themes/tela-theme/package-lock.json wordpress/themes/tela-theme/vite.config.js wordpress/themes/tela-theme/functions.php
git commit -m "feat: wordpress theme scaffolding with vite build setup"
```

---

### Task 10: Theme Bootstrap SASS setup

**Files:**
- Create: `wordpress/themes/tela-theme/src/scss/main.scss`
- Create: `wordpress/themes/tela-theme/src/js/main.js`

- [ ] **Step 1: Create `wordpress/themes/tela-theme/src/scss/main.scss`**

```scss
// Bootstrap variable overrides — must come before the import
$primary:                  #6c3fc5;
$font-family-sans-serif:   'Inter', system-ui, -apple-system, sans-serif;
$body-color:               #1a1a2e;
$line-height-base:         1.75;
$headings-font-weight:     700;
$border-radius:            0.5rem;
$link-color:               $primary;
$link-decoration:          none;

@use "bootstrap/scss/bootstrap";

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

// Single post styles
.post-hero {
  background: linear-gradient(135deg, #f8f6ff 0%, #f0f4ff 100%);
  border-bottom: 1px solid #e8e0ff;
}

.post-title {
  color: $body-color;
  line-height: 1.2;
}

.post-meta {
  font-size: 0.9rem;
}

.post-content {
  font-size: 1.1rem;
  line-height: 1.85;

  p { margin-bottom: 1.5rem; }

  h2,
  h3,
  h4 {
    margin-top: 2rem;
    margin-bottom: 1rem;
    font-weight: 600;
  }
}

.category-badge {
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.35em 0.75em;
}

.site-footer {
  background-color: #1a1a2e !important;
}
```

- [ ] **Step 2: Create `wordpress/themes/tela-theme/src/js/main.js`**

```javascript
import '../scss/main.scss'
import 'bootstrap'
```

- [ ] **Step 3: Build and verify**

```bash
cd wordpress/themes/tela-theme && npm run build
```

Expected: `assets/css/main.css` and `assets/js/main.js` are created.

- [ ] **Step 4: Commit**

```bash
git add wordpress/themes/tela-theme/src/ wordpress/themes/tela-theme/assets/
git commit -m "feat: bootstrap 5 sass setup with vite build"
```

---

### Task 11: Theme PHP templates

**Files:**
- Create: `wordpress/themes/tela-theme/header.php`
- Create: `wordpress/themes/tela-theme/footer.php`
- Create: `wordpress/themes/tela-theme/index.php`

- [ ] **Step 1: Create `wordpress/themes/tela-theme/header.php`**

```php
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>
<body <?php body_class( 'd-flex flex-column min-vh-100' ); ?>>

<header>
    <nav class="navbar navbar-expand-lg navbar-dark" style="background-color: #1a1a2e;">
        <div class="container">
            <a class="navbar-brand fw-bold fs-5" href="<?php echo esc_url( home_url( '/' ) ); ?>">
                <?php bloginfo( 'name' ); ?>
            </a>
        </div>
    </nav>
</header>
```

- [ ] **Step 2: Create `wordpress/themes/tela-theme/footer.php`**

```php
<footer class="site-footer mt-auto py-4 text-white">
    <div class="container text-center">
        <p class="mb-0 small opacity-75">
            &copy; <?php echo esc_html( date( 'Y' ) ); ?>
            <?php bloginfo( 'name' ); ?>
        </p>
    </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
```

- [ ] **Step 3: Create `wordpress/themes/tela-theme/index.php`**

```php
<?php get_header(); ?>

<main class="flex-grow-1 py-5">
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
                    <article class="mb-5 pb-5 border-bottom">
                        <h2 class="h4 mb-2">
                            <a href="<?php the_permalink(); ?>" class="text-dark">
                                <?php the_title(); ?>
                            </a>
                        </h2>
                        <p class="text-muted small mb-3"><?php echo esc_html( get_the_date() ); ?></p>
                        <p class="mb-3"><?php the_excerpt(); ?></p>
                        <a href="<?php the_permalink(); ?>" class="btn btn-sm btn-outline-primary">
                            Read more
                        </a>
                    </article>
                <?php endwhile; else : ?>
                    <p class="text-muted">No posts yet.</p>
                <?php endif; ?>
            </div>
        </div>
    </div>
</main>

<?php get_footer(); ?>
```

- [ ] **Step 4: Commit**

```bash
git add wordpress/themes/tela-theme/header.php wordpress/themes/tela-theme/footer.php wordpress/themes/tela-theme/index.php
git commit -m "feat: theme base templates — header, footer, index"
```

---

### Task 12: single.php — the main design focus

**Files:**
- Create: `wordpress/themes/tela-theme/single.php`

- [ ] **Step 1: Create `wordpress/themes/tela-theme/single.php`**

```php
<?php get_header(); ?>

<?php while ( have_posts() ) : the_post(); ?>

<article>

    <div class="post-hero py-5">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-lg-8">

                    <?php
                    $categories = get_the_category();
                    if ( $categories ) : ?>
                        <span class="badge bg-primary category-badge mb-4 d-inline-block">
                            <?php echo esc_html( $categories[0]->name ); ?>
                        </span>
                    <?php endif; ?>

                    <h1 class="post-title display-5 fw-bold mb-4">
                        <?php the_title(); ?>
                    </h1>

                    <?php if ( get_the_excerpt() ) : ?>
                        <p class="lead text-muted mb-4">
                            <?php echo esc_html( get_the_excerpt() ); ?>
                        </p>
                    <?php endif; ?>

                    <div class="post-meta d-flex gap-4 text-muted">
                        <span><?php echo esc_html( get_the_date( 'F j, Y' ) ); ?></span>
                        <span>
                            <?php
                            $word_count = str_word_count( wp_strip_all_tags( get_the_content() ) );
                            $read_time  = max( 1, (int) ceil( $word_count / 200 ) );
                            echo esc_html( $read_time . ' min read' );
                            ?>
                        </span>
                    </div>

                </div>
            </div>
        </div>
    </div>

    <div class="py-5">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-lg-8">
                    <div class="post-content">
                        <?php the_content(); ?>
                    </div>

                    <div class="mt-5 pt-4 border-top">
                        <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="text-decoration-none text-muted small">
                            &larr; Back to home
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>

</article>

<?php endwhile; ?>

<?php get_footer(); ?>
```

- [ ] **Step 2: Commit**

```bash
git add wordpress/themes/tela-theme/single.php
git commit -m "feat: single post template with clean typography layout"
```

---

### Task 13: Spin up Docker and verify end-to-end

This task has no new files — it's the integration verification.

- [ ] **Step 1: Start all services**

```bash
docker compose up --build -d
```

Wait ~30 seconds for MySQL and WordPress to initialize.

- [ ] **Step 2: Complete WordPress setup**

Open `http://localhost:8080` in a browser and go through the WordPress installer (language, site title, admin user/password). Use any admin credentials — just remember them.

- [ ] **Step 3: Activate the plugin**

Go to `http://localhost:8080/wp-admin` → Plugins → activate **Content Pipeline**.

- [ ] **Step 4: Activate the theme**

Go to Appearance → Themes → activate **Tela Theme**.

- [ ] **Step 5: Test the endpoint with curl**

```bash
curl -s -X POST http://localhost:3000/api/generate-post \
  -H "Content-Type: application/json" \
  -d '{"url": "https://en.wikipedia.org/wiki/Artificial_intelligence"}' | jq .
```

Expected response:
```json
{
  "success": true,
  "postId": 1,
  "postUrl": "http://localhost:8080/?p=1"
}
```

- [ ] **Step 6: Verify the post in WordPress**

Open the `postUrl` from the response in a browser. The post should render with the Tela theme.

---

### Task 14: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

```markdown
# Content Pipeline

An end-to-end content generation and publishing pipeline built for the Portal Tela fullstack challenge.

## Architecture

```
POST /api/generate-post { url }
         │
         ▼
 Content Service (Node.js + TypeScript)
  1. Scrapes the provided URL with Axios + Cheerio
  2. Rewrites the content using Google Gemini (gemini-1.5-flash)
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
| `WEBHOOK_SECRET` | Any random string shared between the service and the plugin |
| `WORDPRESS_WEBHOOK_URL` | Leave as-is for local Docker setup |
| `MYSQL_*` | Leave as-is or change to your preference |

**3. Start everything:**

```bash
docker compose up --build
```

**4. Complete the WordPress installer at `http://localhost:8080`**

Then go to wp-admin → Plugins → activate **Content Pipeline**, and Appearance → Themes → activate **Tela Theme**.

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

Open the `postUrl` to see the published post rendered in the theme.

## Theme development

```bash
cd wordpress/themes/tela-theme
npm install
npm run dev    # watch mode
npm run build  # production build
```

Bootstrap is a dev dependency — customize via SASS variables in `src/scss/main.scss` before the `@use "bootstrap/scss/bootstrap"` import.

## Security notes

- The plugin endpoint is protected by a shared secret token (`Authorization: Bearer <WEBHOOK_SECRET>`)
- The `.env` file is gitignored — never commit it
- In production: use HTTPS, rotate the webhook secret, and consider rate limiting the `/api/generate-post` endpoint
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: project readme with setup and usage instructions"
```

---

### Task 15: Postman collection

**Files:**
- Create: `postman/content-pipeline.postman_collection.json`

- [ ] **Step 1: Create `postman/content-pipeline.postman_collection.json`**

```json
{
  "info": {
    "name": "Content Pipeline",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Generate and publish post",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"url\": \"https://en.wikipedia.org/wiki/Artificial_intelligence\"\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/generate-post",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "generate-post"]
        }
      }
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add postman/content-pipeline.postman_collection.json
git commit -m "docs: postman collection for content pipeline api"
```

---

### Task 16: Interview prep notes (personal file — not committed)

This file goes in your Windows Downloads folder, NOT in the repo.

- [ ] **Step 1: Claude writes `/mnt/c/Users/vitor/Downloads/interview-prep.md`**

The file must cover:

**Tech choices and how to explain them:**
- "I used Node.js with TypeScript because that's my current stack at INEEDS — I can build and debug it fast. TypeScript was already in Portal Tela's stack so it was a natural fit."
- "I chose Google Gemini because it has a generous free tier, and using `gemini-1.5-flash` keeps latency low for a synchronous API call. The service is provider-agnostic — swapping to OpenAI is a one-line change in the model client."
- "I used Cheerio for scraping instead of Puppeteer because the challenge asks for public articles, which are almost always server-rendered. Puppeteer would be overkill and much heavier in Docker."
- "Vite is the build tool because it's already in Portal Tela's stack. It handles SASS compilation and Bootstrap tree-shaking in one pass."
- "Bootstrap is a dev dependency imported via SASS `@use` — this lets me override CSS variables before anything compiles, which is the correct way to customize Bootstrap (not overriding compiled CSS after the fact)."
- "The webhook uses a shared Bearer token instead of WordPress application passwords because it's simpler to rotate and doesn't require a WordPress user session."
- "I pass the secret to WordPress via `WORDPRESS_CONFIG_EXTRA` in Docker Compose — this injects a PHP `define()` into `wp-config.php` at container startup. No hardcoding secrets in the plugin."

**Architecture in your own words (say this on the call):**
"It's a three-piece pipeline. The service is completely decoupled from WordPress — it just knows a webhook URL. If tomorrow you want to publish to Ghost or Contentful instead, you only change the webhook service. The WordPress plugin is also isolated: it doesn't know anything about Gemini or scraping, it just receives a JSON payload and creates a post. That separation was intentional."

**Production readiness talking points:**
- Rate limiting on `/api/generate-post` — Gemini has quotas, and you don't want a single client to exhaust them. Would add `express-rate-limit` with a per-IP limit.
- Async job queue — for high volume, the current synchronous flow (scrape → generate → publish in one request) would time out. Would move to BullMQ + Redis: the endpoint returns a job ID immediately, and a worker processes it in the background.
- Error retries — Gemini calls can fail transiently. Would add retry logic with exponential backoff (or use a job queue's built-in retry).
- HTTPS — the webhook between service and WordPress must be HTTPS in production, otherwise the Bearer token travels in plaintext. Behind a load balancer this is handled by the ALB/nginx, not the app.
- Monitoring — would add structured JSON logging (winston or pino) and ship logs to CloudWatch or Datadog. Key metrics: Gemini latency, scrape errors, WordPress 4xx/5xx rates.
- Content validation — Gemini occasionally returns malformed JSON. The current `JSON.parse` will throw and surface as a 500. In production, would add schema validation (zod) and a fallback prompt retry.
- Secret rotation — the `WEBHOOK_SECRET` is a long-lived shared secret. In production, would store it in AWS Secrets Manager and rotate quarterly.

**Likely interview questions and strong answers:**

Q: "Why not use the WordPress REST API directly instead of a custom plugin?"
A: "The built-in WordPress REST API for posts requires authentication via application passwords or OAuth, which adds setup complexity. A custom plugin lets me define exactly the endpoint shape and auth scheme I want — and it keeps the integration explicit and auditable."

Q: "How would you handle a URL that blocks bots or requires JavaScript rendering?"
A: "Cheerio only works on static HTML. For JS-rendered pages I'd swap the scraper to use Puppeteer with a headless Chromium instance. The scraper module is isolated behind an interface, so the route handler doesn't need to change — just the implementation."

Q: "What happens if Gemini returns garbage or the post creation fails?"
A: "Right now the error propagates as a 500 with a message. In production I'd add zod schema validation on the Gemini response before touching WordPress, and if it fails validation I'd retry the Gemini call with a stricter prompt. WordPress errors are already returned with their own message from `get_error_message()`."

Q: "How would you scale this?"
A: "The main bottleneck is Gemini — it's a synchronous external call that can take 3-10 seconds. For scale I'd make the endpoint async: return a job ID immediately, push the job to a BullMQ queue, and let workers process it. That way the API stays fast regardless of Gemini latency, and you can scale workers horizontally."

Q: "Why Bootstrap and not Tailwind?"
A: "The challenge spec explicitly required Bootstrap. But even setting that aside, Bootstrap made sense here — it's already in Portal Tela's stack, and the theme's scope is a single post page, not a complex component-heavy UI."

- [ ] **Step 2: Verify file exists**

```bash
ls /mnt/c/Users/vitor/Downloads/interview-prep.md
```

No commit needed — this file is for you only.
