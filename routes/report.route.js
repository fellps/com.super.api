import express from 'express'
import report from '../controllers/report.controller'

const app = express()

app.get('/financial/sales-summary/:eventId/', report.salesSummary)
app.get('/producer/orders-delivered/:eventId/', report.ordersDelivered)

export default app