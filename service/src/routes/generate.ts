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
