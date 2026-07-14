import axios from 'axios'
import { GeneratedContent } from './gemini'
import { config } from '../config'

export class PublishingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PublishingError'
  }
}

export interface WordPressPost {
  id: number
  link: string
}

export async function publishToWordPress(content: GeneratedContent): Promise<WordPressPost> {
  try {
    const { data } = await axios.post<WordPressPost>(config.WORDPRESS_WEBHOOK_URL, content, {
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Pipeline-Secret': config.WEBHOOK_SECRET,
      },
      timeout: 15000,
    })

    return data
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new PublishingError(`Failed to publish to WordPress: ${message}`)
  }
}
