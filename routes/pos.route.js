import express from 'express'
import pos from '../controllers/pos.controller'

const app = express()

app.post('/config', pos.config)
app.post('/transaction', pos.saveTransaction)
app.post('/transaction/delivery', pos.saveTransactionDelivery)
app.post('/update', pos.update)


export default app