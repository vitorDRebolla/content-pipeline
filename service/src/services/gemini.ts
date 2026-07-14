import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'
import { GenerationError } from '../errors'

export interface GeneratedContent {
  title: string
  content: string
  excerpt: string
  status: 'publish'
}

const generatedContentSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  excerpt: z.string().min(1).max(500),
})

const modelName = process.env.GEMINI_MODEL
if (!modelName) {
  throw new Error('GEMINI_MODEL is not configured')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: modelName })

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

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text().trim().replace(/^```json\n?/, '').replace(/\n?```$/, '')

    const parsed = generatedContentSchema.parse(JSON.parse(text))

    return { ...parsed, status: 'publish' }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new GenerationError(`Failed to generate content: ${message}`)
  }
}
