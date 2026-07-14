import axios from 'axios'
import * as cheerio from 'cheerio'

export class ScrapingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ScrapingError'
  }
}

export interface ScrapedContent {
  title: string
  text: string
}

function isAllowedUrl(url: string): boolean {
  const parsed = new URL(url)

  if (!['http:', 'https:'].includes(parsed.protocol)) return false

  const host = parsed.hostname
  if (host === 'localhost' || host === '::1') return false
  if (/^127\./.test(host)) return false
  if (host === '0.0.0.0') return false
  if (/^169\.254\./.test(host)) return false
  if (/^10\./.test(host)) return false
  if (/^192\.168\./.test(host)) return false
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false
  if (/^fc[0-9a-f][0-9a-f]:/i.test(host) || /^fe[89ab][0-9a-f]:/i.test(host)) return false

  return true
}

export async function scrapeUrl(url: string): Promise<ScrapedContent> {
  if (!isAllowedUrl(url)) {
    throw new ScrapingError('URL is not allowed')
  }

  try {
    const { data } = await axios.get(url, {
      timeout: 10_000,
      maxContentLength: 10_000_000,
      maxBodyLength: 10_000_000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
    })

    const $ = cheerio.load(data)

    const title =
      $('h1').first().text().trim() ||
      $('title').first().text().trim()

    const paragraphs = $('p')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((p) => p.length > 50)
      .join('\n\n')

    return { title, text: paragraphs }
  } catch (err) {
    if (err instanceof ScrapingError) throw err
    const message = err instanceof Error ? err.message : String(err)
    throw new ScrapingError(`Failed to scrape URL: ${message}`)
  }
}
