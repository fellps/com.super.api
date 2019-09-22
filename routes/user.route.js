import express from 'express'
import user from '../controllers/user.controller'
import { verifyAdminJWT } from '../modules/jwt'

const app = express()

app.get('/', verifyAdminJWT, user.findAll)
app.post('/', user.create)
app.get('/:userId', user.findOne)
app.put('/:userId', user.update)
app.delete('/:userId', user.delete)

export default app