import express from 'express'
import producer from '../controllers/producer.controller'

const app = express()

app.get('/', producer.findAll)
app.post('/', producer.create)
app.get('/:producerId', producer.findOne)
app.put('/:producerId', producer.update)
app.delete('/:producerId', producer.delete)

export default app