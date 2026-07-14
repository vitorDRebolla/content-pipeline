import './config'
import express from 'express'
import generateRoute from './routes/generate'

const app = express()

app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api', generateRoute)

export default app
