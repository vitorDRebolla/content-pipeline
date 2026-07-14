import request from 'supertest'
import app from '../index'

jest.mock('../services/scraper', () => ({
  scrapeUrl: jest.fn().mockResolvedValue({ title: 'Test Title', text: 'Test article body text.' }),
  ScrapingError: class ScrapingError extends Error { name = 'ScrapingError' },
}))

jest.mock('../services/gemini', () => ({
  generateContent: jest.fn().mockResolvedValue({
    title: 'Generated Title',
    content: '<p>Generated content.</p>',
    excerpt: 'A generated excerpt.',
    status: 'publish',
  }),
  GenerationError: class GenerationError extends Error { name = 'GenerationError' },
}))

jest.mock('../services/webhook', () => ({
  publishToWordPress: jest.fn().mockResolvedValue({ id: 42, link: 'http://localhost/?p=42' }),
  PublishingError: class PublishingError extends Error { name = 'PublishingError' },
}))

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
})

describe('POST /api/generate-post', () => {
  it('returns 400 when body is empty', async () => {
    const res = await request(app).post('/api/generate-post').send({})
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 400 when URL is not valid', async () => {
    const res = await request(app)
      .post('/api/generate-post')
      .send({ url: 'not-a-url' })
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('returns 201 with postId and postUrl on success', async () => {
    const res = await request(app)
      .post('/api/generate-post')
      .send({ url: 'https://example.com/article' })
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.postId).toBe(42)
    expect(res.body.postUrl).toBe('http://localhost/?p=42')
  })
})
