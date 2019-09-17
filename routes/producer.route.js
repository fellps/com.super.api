import express from 'express'
import producer from '../controllers/producer.controller'

const app = express()

app.post('/', producer.create)
app.get('/:producerId', producer.findOne)
app.put('/:producerId', producer.update)
app.delete('/:producerId', producer.delete)
app.get('/producers', producer.findAll)

export default app