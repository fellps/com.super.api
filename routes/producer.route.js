import express from 'express'
import producer from '../controllers/producer.controller'
import { verifyAdminJWT } from '../modules/jwt'

const app = express()

app.get('/', verifyAdminJWT, producer.findAll)
app.post('/', producer.create)
app.get('/:producerId', producer.findOne)
app.put('/:producerId', producer.update)
app.delete('/:producerId', producer.delete)

export default app