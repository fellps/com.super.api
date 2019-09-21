import express from 'express'
import device from '../controllers/device.controller'

const app = express()

app.get('/:eventId/list', device.findAll)
app.post('/:eventId', device.create)
app.get('/:deviceId', device.findOne)
app.put('/:deviceId', device.update)
app.delete('/:deviceId', device.delete)

export default app