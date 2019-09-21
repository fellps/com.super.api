import express from 'express'
import auth from '../controllers/auth.controller'

const app = express()

app.post('/login', auth.login)
app.get('/logout', auth.logout)

export default app