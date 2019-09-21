import express from 'express'
import Producer from './producer.route'
import Event from './event.route'
import Menu from './menu.route'
import Product from './product.route'
import Device from './device.route'
import Auth from './auth.route'
import Result from '../modules/result'
import VerifyJWT from '../modules/jwt'

const app = express()

app
  .get('/', (req, res) => {
    return Result.Success.ApiSuccess(res)
  })
  .use('/producers', VerifyJWT, Producer)
  .use('/events', VerifyJWT, Event)
  .use('/menus', VerifyJWT, Menu)
  .use('/products', VerifyJWT, Product)
  .use('/devices', VerifyJWT, Device)
  .use('/auth', Auth)

export default app
