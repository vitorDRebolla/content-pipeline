import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_MODEL: z.string().min(1).default('gemini-3.1-flash-lite'),
  WORDPRESS_WEBHOOK_URL: z.string().url('WORDPRESS_WEBHOOK_URL must be a valid URL'),
  WEBHOOK_SECRET: z.string().min(1, 'WEBHOOK_SECRET is required'),
})

const result = schema.safeParse(process.env)

if (!result.success) {
  const errors = result.error.issues.map((e) => `  ${e.path.join('.')}: ${e.message}`)
  console.error('Missing or invalid environment variables:\n' + errors.join('\n'))
  process.exit(1)
}

export const config = result.data
