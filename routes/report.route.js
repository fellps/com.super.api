import express from 'express'
import report from '../controllers/report.controller'

const app = express()

app.get('/financial/sales-summary/:eventId/', report.salesSummary)
app.get('/producer/orders-delivered/:eventId/', report.ordersDelivered)
app.get('/financial/cashier-closing/:eventId/', report.cashierClosing)
app.get('/financial/cashier-closing/:eventId/:cpf', report.singleCashierClosing)

export default app