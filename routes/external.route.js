import express from 'express'
import report from '../controllers/report.controller'

const app = express()

app.get('/reports/financial/sales-summary/:eventId/', report.salesSummary)

export default app