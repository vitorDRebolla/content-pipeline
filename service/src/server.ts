import app from './index'
import { config } from './config'

app.listen(config.PORT, () => {
  console.log(`Service running on port ${config.PORT}`)
})
