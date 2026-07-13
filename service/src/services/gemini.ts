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
