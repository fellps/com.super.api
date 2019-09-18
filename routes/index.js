import express from 'express'
import producer from './producer.route'
import event from './event.route'

const app = express()

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Super API' })
})
  .use('/producers', producer)
  .use('/events', event)

export default app
