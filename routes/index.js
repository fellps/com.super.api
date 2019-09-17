import express from 'express'
import producer from './producer.route'

const app = express()

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Super API' })
})
  .use('/producer', producer)

export default app
