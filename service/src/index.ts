import express from 'express'
import dotenv from 'dotenv'
import generateRoute from './routes/generate'

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use('/api', generateRoute)

app.listen(port, () => {
  console.log(`Service running on port ${port}`)
})

export default app
