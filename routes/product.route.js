import express from 'express'
import product from '../controllers/product.controller'

const app = express()

app.get('/:eventId/list', product.findAll)
app.post('/:eventId', product.create)
app.get('/:productId', product.findOne)
app.put('/:productId', product.update)
app.delete('/:productId', product.delete)

export default app