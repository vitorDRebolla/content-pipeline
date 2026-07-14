import axios from 'axios'
import { GeneratedContent } from './gemini'
import { PublishingError } from '../errors'

export interface WordPressPost {
  id: number
  link: string
}

export async function publishToWordPress(content: GeneratedContent): Promise<WordPressPost> {
  const webhookUrl = process.env.WORDPRESS_WEBHOOK_URL
  const secret = process.env.WEBHOOK_SECRET

  try {
    const { data } = await axios.post<WordPressPost>(webhookUrl!, content, {
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Pipeline-Secret': secret!,
      },
      timeout: 15000,
    })

    return data
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new PublishingError(`Failed to publish to WordPress: ${message}`)
  }
}
