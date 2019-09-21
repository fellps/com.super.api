import express from 'express'
import menu from '../controllers/menu.controller'

const app = express()

app.get('/:eventId/list', menu.findAll)
app.post('/:eventId', menu.create)
app.get('/:menuId', menu.findOne)
app.put('/:menuId', menu.update)
app.delete('/:menuId', menu.delete)

export default app