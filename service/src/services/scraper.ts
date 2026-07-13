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
