import express from 'express'
import report from '../controllers/report.controller'

const app = express()

app.get('/financial/sales-summary/:eventId/', report.financial)

export default app