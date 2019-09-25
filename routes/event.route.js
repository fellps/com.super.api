import express from 'express'
import event from '../controllers/event.controller'

const app = express()

app.get('/', event.findAll)
app.post('/', event.create)
app.get('/:eventId', event.findOne)
app.put('/:eventId', event.update)
app.delete('/:eventId', event.delete)

export default app