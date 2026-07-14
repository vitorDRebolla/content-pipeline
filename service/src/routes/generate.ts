import { Router, Request, Response } from 'express'
import { scrapeUrl, ScrapingError } from '../services/scraper'
import { generateContent, GenerationError } from '../services/gemini'
import { publishToWordPress, PublishingError } from '../services/webhook'

const router = Router()

router.post('/generate-post', async (req: Request, res: Response) => {
  const { url } = req.body

  if (!url || !isValidUrl(url)) {
    res.status(400).json({ success: false, error: 'A valid URL is required' })
    return
  }

  try {
    const raw = await scrapeUrl(url)
    const generated = await generateContent(raw)
    const post = await publishToWordPress(generated)

    res.status(201).json({ success: true, postId: post.id, postUrl: post.link })
  } catch (err) {
    console.error('[generate-post]', err)

    if (err instanceof ScrapingError) {
      res.status(502).json({ success: false, stage: 'scraping', error: err.message })
      return
    }
    if (err instanceof GenerationError) {
      res.status(502).json({ success: false, stage: 'generation', error: err.message })
      return
    }
    if (err instanceof PublishingError) {
      res.status(502).json({ success: false, stage: 'publishing', error: err.message })
      return
    }

    res.status(500).json({ success: false, error: 'Unexpected error' })
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
