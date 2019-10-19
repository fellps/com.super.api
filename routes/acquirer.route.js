import express from 'express'
import acquirer from '../controllers/acquirer.controller'

const app = express()

app.get('/', acquirer.findAll)

export default app