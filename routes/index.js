import express from 'express'
import Producer from './producer.route'
import Event from './event.route'
import Menu from './menu.route'
import Result from '../modules/result'

const app = express()

app
  .get('/', (req, res) => {
    return Result.Success.ApiSuccess(res)
  })
  .use('/producers', Producer)
  .use('/events', Event)
  .use('/menus', Menu)

export default app
