import express from 'express'
import Producer from './producer.route'
import Event from './event.route'
import Menu from './menu.route'
import Product from './product.route'
import Device from './device.route'
import User from './user.route'
import Auth from './auth.route'
import Report from './report.route'
import POS from './pos.route'
import Acquirer from './acquirer.route'
import External from './external.route'

import Result from '../modules/result'
import VerifyJWT from '../modules/jwt'
import Decode from '../modules/decode'

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
  .use('/reports', Report)
  .use('/users', User)
  .use('/auth', Auth)
  .use('/pos', Decode, POS)
  .use('/acquirers', VerifyJWT, Acquirer)
  .use('/external', External)

export default app
