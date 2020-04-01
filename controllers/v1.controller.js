import Producer from '../models/producer.model'
import Application from '../models/application.model'
import Transaction from '../models/transaction.model'
import Result from '../modules/result'
import _ from 'lodash'
import MD5 from 'md5'
import AppendQuery from 'append-query'
import Crypto from 'crypto'
import Jwt from 'jsonwebtoken'
import moment from 'moment-timezone'
import mongoose from 'mongoose'

export default {
  createEvent: async (req, res) => {
    if(_.isEmpty(req.body)) {
      return Result.Error.RequiredBody(res)
    }

    const producerKey = String(req.body.producer_key).replace(/[^0-9]/gi, '')
    const startAt = moment.utc(req.body.event_start_date, 'YYYY-MM-DD HH:mm:ss').tz('America/Sao_Paulo').format('YYYY-MM-DD HH:mm:ss.SSS')

    let producer = await Producer.findOne({
      cnpj: producerKey
    }).exec()

    if (_.isEmpty(producer)) {
      producer = new Producer({
        socialReason: req.body.producer_name,
        cnpj: producerKey,
        cep: '',
        state: '',
        city: '',
        address: '',
        addressNumber: '',
        email: '',
        phone: '',
        userId: req.userId,
        isEnabled: true
      })
  
      await producer.save()

      producer = await Producer.findOne({
        cnpj: producerKey
      }).exec()
    }

    if (!_.isEmpty(producer)) {
      producer.events.push({
        idExternal: req.body.event_id,
        name: req.body.event_name,
        startDate: startAt,
        endDate: startAt,
        cep: '',
        state: '',
        city: '',
        address: '',
        addressNumber: '0',
        description: '',
        managerPassword: '456789',
        cashierClosingPassword: '987654',
        image: '',
        isEnabled: true
      })
      producer.save()
      return Result.Success.SuccessOnSave(res, producer)
    }
  },

  eventReport: async (req, res) => {
    try {
      const event = await Producer.findOne({
        'events.idExternal': req.params.idExternal,
      }, 'events.$').exec()

      if (event === null) return Result.NotFound.NotFoundEvent(res)

      const matchEvent = {    
        eventId: mongoose.Types.ObjectId(event.events.shift()._id), 
        canceledAt: null,
      }
      
      const queryEvent = await Transaction.aggregate([
        { $match: matchEvent },
        { $group: { _id: null, totalEventAmount: { $sum: '$amount' }, totalTransactions: { $sum: 1 } } },
      ])

      const queryPOS = await Transaction.distinct('deviceId', matchEvent)

      const queryPaymentMethod = await Transaction.aggregate([
        { $match: matchEvent },
        {
          $group: {
            _id: {$toLower: '$paymentMethod'},
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ])
        
      const queryProducts = await Transaction.aggregate([
        {
          $match: matchEvent
        },
        {
          $unwind: '$products'
        }, 
        {
          $group: {
            _id: {
              product: '$products._id'
            },
            totalCount: { $sum: '$products.count' },
            totalAmount: { $sum: { $multiply: ['$products.count', '$products.value'] } }
          }
        },
        { $sort : { 'totalCount': -1 } },
        {
          $group: {
            _id: null,
            products: {
              $push: {
                id: '$_id.product',
                totalCount: '$totalCount',
                totalAmount: '$totalAmount'
              }
            }
          }
        }
      ])

      const eventData = queryEvent.shift()

      const paymentMethod = queryPaymentMethod.map(pm => {
        let paymentMethod = getPaymentMethod(pm._id)

        return {
          id: pm._id,
          paymentMethod: paymentMethod,
          count: pm.count,
          totalAmount: pm.totalAmount,
          percent: parseFloat((pm.count / eventData.totalTransactions) * 100).toFixed(1)
        }
      })

      const producer = await Producer.findOne({
        'events._id': matchEvent.eventId,
      }, 'events.$').exec()

      const products = queryProducts.shift().products.map(p => {
        const product = producer.events[0].products.id(p.id)
        p['name'] = product.name
        p['percent'] = parseInt((p.totalAmount / eventData.totalEventAmount) * 100)
        return p
      })

      var totalProducts = products.reduce((total, element) => {
        return total += element.totalCount
      }, 0)
        
      const result = {
        eventId: producer.events[0]._id,
        eventName: producer.events[0].name,
        totalEventAmount: eventData.totalEventAmount,
        totalTransactions: eventData.totalTransactions,
        totalProducts: totalProducts,
        totalPOS: queryPOS.length,
        paymentMethod: paymentMethod,
        productSummary: products
      }

      return Result.Success.SuccessOnSearch(res, result)
    } catch (err) {
      return Result.Error.ErrorOnSearch(res, err.message)
    }
  },

  getAuthorization: async (req, res) => {
    const clientId = req.query.client_id
    const redirectUri = req.query.redirect_uri
    const responseType = req.query.response_type

    if (_.isEmpty(clientId)) return Result.Error.RequiredClientId(res)
    if (_.isEmpty(redirectUri)) return Result.Error.RequiredRedirectUri(res)

    if (responseType === 'code') {
      Application.findOne({ clientId })
        .then(app => {
          if (app === null) return Result.Unauthorized.ErrorOnApplication(res)
          
          const code = Crypto.createHmac('sha256', process.env.PASSWORD_SECRET)
            .update(MD5(Math.random().toString(36)))
            .digest('hex')

          Application.findOneAndUpdate(
            { clientId: app.clientId },
            { code }
          )
            .then(() => {
              res.redirect(AppendQuery(redirectUri, `code=${code}`))
            })
            .catch(() => {
              return Result.Error.ErrorOnOperation(res)
            })
        })
        .catch(() => {
          return Result.Error.ErrorOnOperation(res)
        })
    } else {
      return Result.Error.ErrorOnResponseType(res)
    }
  },

  // client_id = APP-972MJKWE42ZAQ1X
  // client_secret = 9450262B-F8C0-4080-8E87-A9D2C33B051E
  getToken: async (req, res) => {
    const clientId = req.body.client_id
    const clientSecret = req.body.client_secret
    const code = req.body.code
    const grantType = req.body.grant_type
    const refreshToken = req.body.refresh_token

    if (_.isEmpty(clientId)) return Result.Error.RequiredClientId(res)
    if (_.isEmpty(clientSecret)) return Result.Error.RequiredClientSecret(res)

    if (grantType === 'authorization_code' || grantType === 'refresh_token') {
      let filter = { 
        clientId,
        clientSecret
      }

      if (grantType === 'authorization_code') filter.code = code
      if (grantType === 'refresh_token') filter.refreshToken = refreshToken

      Application.findOne(filter)
        .then(app => {
          if (app === null) return Result.Unauthorized.ErrorOnApplication(res)

          const expiresIn = 60 * 60 * 24 // expires in 24h
          const accessToken = Jwt.sign({ id: app.clientId }, process.env.JWT_SECRET, {
            expiresIn
          })
          const refreshToken = Crypto.createHmac('sha256', process.env.PASSWORD_SECRET)
            .update(MD5(Math.random().toString(36)))
            .digest('hex')

          Application.findOneAndUpdate(
            { clientId: app.clientId },
            { accessToken, refreshToken }
          )
            .then(() => {
              const result = {
                access_token: accessToken,
                refresh_token: refreshToken,
                token_type: 'x-access-token',
                expires_in: expiresIn,
                scope: '*'
              }
              
              return Result.Success.SuccessOnOperation(res, result)
            })
            .catch(() => {
              return Result.Error.ErrorOnOperation(res)
            })
        })
        .catch(() => {
          return Result.Error.ErrorOnOperation(res) 
        })
    } else {
      return Result.Error.ErrorOnGrantType(res)
    }
  }
}

function getPaymentMethod (paymentMethodId) {
  let paymentMethod

  if (paymentMethodId == '1')
    paymentMethod = 'Crédito'
  else if  (paymentMethodId == '2')
    paymentMethod = 'Débito'
  else if (paymentMethodId == '3')
    paymentMethod = 'Dinheiro'

  return paymentMethod
}