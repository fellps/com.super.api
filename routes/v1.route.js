import express from 'express'
import v1 from '../controllers/v1.controller'
import { verifyJWTExternal } from '../modules/jwt'

const app = express()

app.get('/oauth2/authorize', v1.getAuthorization)
app.post('/oauth2/token', v1.getToken)
app.post('/events', verifyJWTExternal, v1.createEvent)
app.get('/event/:idExternal', verifyJWTExternal, v1.eventReport)

export default app