import express from 'express'
import pos from '../controllers/pos.controller'

const app = express()

app.post('/config', pos.config)
app.post('/transaction', pos.saveTransaction)

export default app