import Transaction from '../models/transaction.model'
import Producer from '../models/producer.model'
import mongoose from 'mongoose'
import Result from '../modules/result'
import moment from 'moment-timezone'
import _ from 'lodash'

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

export default {
  // Sales summary report
  salesSummary: async (req, res) => {
    try {
      const cpf = req.query.cpf || ''
      const terminalCode = req.query.terminalCode || ''
      
      let startAt = moment(req.query.startAt, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DD HH:mm:ss.SSS')
      let endAt = moment(req.query.endAt, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DD HH:mm:ss.SSS')

      if (endAt === 'Invalid date') {
        endAt = moment().format('YYYY-MM-DD HH:mm:ss.SSS')
      }
  
      let startAtObj = new Date(startAt)
      let endAtObj = new Date(endAt)

      startAtObj.setHours(startAtObj.getHours() - 2)
      endAtObj.setHours(endAtObj.getHours() - 2)
      
      let matchEvent = {    
        eventId: mongoose.Types.ObjectId(req.params.eventId), 
        canceledAt: null,
      }

      if (startAtObj.toString() !== 'Invalid Date') {
        matchEvent.createdAt = { $gte: startAtObj, $lte: endAtObj }
      }
  
      if (!_.isEmpty(cpf)) {
        matchEvent.loggedUserDocument = cpf
      }

      if (!_.isEmpty(terminalCode)) {
        matchEvent.terminalCode = terminalCode
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

      const event = queryEvent.shift()

      const paymentMethod = queryPaymentMethod.map(pm => {
        let paymentMethod = getPaymentMethod(pm._id)

        return {
          id: pm._id,
          paymentMethod: paymentMethod,
          count: pm.count,
          totalAmount: pm.totalAmount,
          percent: parseFloat((pm.count / event.totalTransactions) * 100).toFixed(1)
        }
      })

      const producer = await Producer.findOne({
        'events._id': req.params.eventId,
      }, 'events.$').exec()

      const products = queryProducts.shift().products.map(p => {
        const product = producer.events[0].products.id(p.id)
        p['name'] = product ? product.name : 'PRODUTO EXCLUÍDO'
        p['percent'] = parseInt((p.totalAmount / event.totalEventAmount) * 100)
        return p
      })

      var totalProducts = products.reduce((total, element) => {
        return total += element.totalCount
      }, 0)
        
      const result = {
        eventId: producer.events[0]._id,
        eventName: producer.events[0].name,
        totalEventAmount: event.totalEventAmount,
        totalTransactions: event.totalTransactions,
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

  // Orders delivered report
  ordersDelivered: async (req, res) => {
    try {
      const queryDeliverers = await Transaction.distinct('deliveryUser', { 
        eventId: mongoose.Types.ObjectId(req.params.eventId),
        isDelivered: true
      })

      const queryOrdersDelivered = await Transaction.aggregate([
        {
          $match: {
            eventId: mongoose.Types.ObjectId(req.params.eventId),
            isDelivered: true,
            _id: {
              $ne: null
            }
          }
        }, 
        {
          $unwind: '$products'
        },
        {
          $group: { 
            _id: null,
            total: {  $sum: 1 },
            totalAmount: { $sum: '$products.value' }
          }
        }
      ])

      const queryOrdersDeliveredByUser = await Transaction.aggregate([
        {
          $match: {
            eventId: mongoose.Types.ObjectId(req.params.eventId),
            isDelivered: true,
            _id: {
              $ne: null
            }
          }
        },
        {
          $unwind: '$products'
        },
        {
          $group: { 
            _id: {
              deliveryUser: '$deliveryUser',
              productId: '$products._id'
            },
            totalCount: { $sum: 1 },
            totalAmount: { $sum: '$products.value' }
          }
        },
        {
          $sort : { 
            '_id.deliveryUser': 1,
            'totalAmount': -1
          } 
        },
        {
          $group: {
            _id: null,
            deliveries: {
              $push: {
                productId: '$_id.productId',
                totalCount: '$totalCount',
                totalAmount: '$totalAmount',
                cpf: '$_id.deliveryUser'
              }
            }
          }
        }
      ])

      const queryProducts = await Transaction.aggregate([
        {
          $match: { 
            eventId: mongoose.Types.ObjectId(req.params.eventId),
            isDelivered: true
          }
        },
        {
          $unwind: '$products'
        }, 
        {
          $group: {
            _id: {
              product: '$products._id'
            },
            totalCount: { $sum: 1 },
            totalAmount: { $sum: '$products.value' }
          },
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

      const producer = await Producer.findOne({
        'events._id': req.params.eventId,
      }, 'events.$').exec()

      const products = queryProducts.shift().products.map(p => {
        const product = producer.events[0].products.id(p.id)
        p['name'] = product ? product.name : 'PRODUTO EXCLUÍDO'
        return p
      })

      const ordersDeliveredByUser = queryOrdersDeliveredByUser.shift().deliveries.map(p => {
        const product = producer.events[0].products.id(p.productId)
        p['name'] = product ? product.name : 'PRODUTO EXCLUÍDO'
        return p
      })

      const ordersDelivered = queryOrdersDelivered.shift()

      const result = {
        totalDeliverers: queryDeliverers.length,
        totalOrdersDelivered: ordersDelivered.total,
        totalDeliveredAmount: ordersDelivered.totalAmount,
        ordersDeliveredByUser,
        products
      }

      return Result.Success.SuccessOnSearch(res, result)
    } catch (err) {
      return Result.Error.ErrorOnSearch(res, err.message)
    }
  },

  // Cashier closing report
  singleCashierClosing: async (req, res) => {
    if (_.isEmpty(req.params.eventId) || _.isEmpty(req.params.cpf))
      return Result.Error.ErrorOnSearch(res, 'Informe os parametros antes de continuar!')

    const startAt = moment(req.query.startAt, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DD HH:mm:ss.SSS')
    const endAt = moment(req.query.endAt, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DD HH:mm:ss.SSS')

    const terminalCode = req.query.terminalCode || ''

    let startAtObj = new Date(startAt)
    let endAtObj = new Date(endAt)

    startAtObj.setHours(startAtObj.getHours() - 2)
    endAtObj.setHours(endAtObj.getHours() - 2)

    let matchPaymentMethod = {           
      eventId: mongoose.Types.ObjectId(req.params.eventId),
      loggedUserDocument: req.params.cpf,
      canceledAt: null,
      createdAt: { $gte: startAtObj, $lte: endAtObj },
    }

    if (!_.isEmpty(terminalCode)) {
      matchPaymentMethod.terminalCode = terminalCode
    }

    const queryPaymentMethod = await Transaction.aggregate([
      { 
        $match: matchPaymentMethod
      },
      {
        $group: {
          _id: {$toLower: '$paymentMethod'},
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ])

    let matchCanceled = {           
      eventId: mongoose.Types.ObjectId(req.params.eventId),
      loggedUserDocument: req.params.cpf,
      canceledAt: { $exists: true, $ne: null },
      createdAt: { $gte: startAtObj, $lte: endAtObj }
    }

    if (!_.isEmpty(terminalCode)) {
      matchCanceled.terminalCode = terminalCode
    }

    const queryPaymentMethodCanceled = await Transaction.aggregate([
      { 
        $match: matchCanceled
      },
      {
        $group: {
          _id: { },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ])

    let matchProducts = { 
      eventId: mongoose.Types.ObjectId(req.params.eventId),
      loggedUserDocument: req.params.cpf,
      canceledAt: null,
      createdAt: { $gte: startAtObj, $lte: endAtObj }
    }

    if (!_.isEmpty(terminalCode)) {
      matchProducts.terminalCode = terminalCode
    }
    
    const queryProducts = await Transaction.aggregate([
      {
        $match: matchProducts
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
      { $sort : { totalCount: -1 } },
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

    let matchProductsCanceled = { 
      eventId: mongoose.Types.ObjectId(req.params.eventId),
      loggedUserDocument: req.params.cpf,
      canceledAt: { $exists: true, $ne: null },
      createdAt: { $gte: startAtObj, $lte: endAtObj }
    }

    if (!_.isEmpty(terminalCode)) {
      matchProductsCanceled.terminalCode = terminalCode
    }

    const queryProductsCanceled = await Transaction.aggregate([
      {
        $match: matchProductsCanceled
      },
      {
        $unwind: '$products'
      }, 
      {
        $group: {
          _id: {
            product: '$products._id',
            paymentMethod: '$paymentMethod'
          },
          totalCount: { $sum: '$products.count' },
          totalAmount: { $sum: { $multiply: ['$products.count', '$products.value'] } }
        }
      },
      { $sort : { 'products.id': -1 } },
      {
        $group: {
          _id: null,
          products: {
            $push: {
              id: '$_id.product',
              paymentMethod: '$_id.paymentMethod',
              totalCount: '$totalCount',
              totalAmount: '$totalAmount'
            }
          }
        }
      }
    ])

    const producer = await Producer.findOne({
      'events._id': req.params.eventId,
    }, 'events.$').exec()

    const products = queryProducts.length > 0 && queryProducts.shift().products.map(p => {
      const product = producer.events[0].products.id(p.id)
      p['name'] = product ? product.name : 'PRODUTO EXCLUÍDO'
      return p
    })

    const productsCanceled = queryProductsCanceled.length > 0 && queryProductsCanceled.shift().products.map(p => {
      const product = producer.events[0].products.id(p.id)
      p['name'] = product ? product.name : 'PRODUTO EXCLUÍDO'
      p['paymentMethod'] = getPaymentMethod(p.paymentMethod)
      return p
    })

    const productsCanceledOrdered = productsCanceled.length > 0 && productsCanceled.sort((a, b) => a.name.localeCompare(b.name))

    let total = {
      count: 0,
      totalAmount: 0
    }
    const paymentMethod = queryPaymentMethod.length > 0 && queryPaymentMethod.map(pm => {
      let paymentMethod = getPaymentMethod(pm._id)
      
      total.count += pm.count
      total.totalAmount += pm.totalAmount

      return {
        id: pm._id,
        paymentMethod: paymentMethod,
        count: pm.count,
        totalAmount: pm.totalAmount
      }
    })
    const paymentMethodTotal = {
      ...total
    }

    let paymentMethodCanceled = [{
      count: 0,
      totalAmount: 0
    }]
    
    if (queryPaymentMethodCanceled.length > 0) {
      paymentMethodCanceled = queryPaymentMethodCanceled.map(pm => {
        let paymentMethod = getPaymentMethod(pm._id)

        return {
          paymentMethod: paymentMethod,
          count: pm.count,
          totalAmount: pm.totalAmount
        }
      })
    }

    if (paymentMethodCanceled.length > 0) {
      paymentMethodCanceled = paymentMethodCanceled.shift()
    }

    const result = {
      products: products || [],
      productsCanceled: productsCanceledOrdered || [],
      paymentMethod: paymentMethod || [],
      paymentMethodTotal: paymentMethodTotal,
      paymentMethodCanceled: paymentMethodCanceled
    }

    return Result.Success.SuccessOnSearch(res, result)
  },

  cashierClosing: async (req, res) => {
    if (_.isEmpty(req.params.eventId) || _.isEmpty(req.params.cpf))
      return Result.Error.ErrorOnSearch(res, 'Informe os parametros antes de continuar!')

    const queryPaymentMethod = await Transaction.aggregate([
      { 
        $match: {           
          eventId: mongoose.Types.ObjectId(req.params.eventId),
          loggedUserDocument: req.params.cpf,
          canceledAt: null  
        }
      },
      {
        $group: {
          _id: {$toLower: '$paymentMethod'},
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ])

    const queryPaymentMethodCanceled = await Transaction.aggregate([
      { 
        $match: {           
          eventId: mongoose.Types.ObjectId(req.params.eventId),
          loggedUserDocument: req.params.cpf,
          canceledAt: { $exists: true, $ne: null }
        }
      },
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
        $match: { 
          eventId: mongoose.Types.ObjectId(req.params.eventId),
          loggedUserDocument: req.params.cpf,
          canceledAt: null 
        }
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
      { $sort : { totalCount: -1 } },
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

    const queryProductsCanceled = await Transaction.aggregate([
      {
        $match: { 
          eventId: mongoose.Types.ObjectId(req.params.eventId),
          loggedUserDocument: req.params.cpf,
          canceledAt: { $exists: true, $ne: null }
        }
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
      { $sort : { totalCount: -1 } },
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

    const producer = await Producer.findOne({
      'events._id': req.params.eventId,
    }, 'events.$').exec()

    const products = queryProducts.length > 0 && queryProducts.shift().products.map(p => {
      const product = producer.events[0].products.id(p.id)
      p['name'] = product ? product.name : 'PRODUTO EXCLUÍDO'
      return p
    })

    const productsCanceled = queryProductsCanceled.length > 0 && queryProductsCanceled.shift().products.map(p => {
      const product = producer.events[0].products.id(p.id)
      p['name'] = product ? product.name : 'PRODUTO EXCLUÍDO'
      return p
    })

    const paymentMethod = queryPaymentMethod.length > 0 && queryPaymentMethod.map(pm => {
      let paymentMethod = getPaymentMethod(pm._id)

      return {
        id: pm._id,
        paymentMethod: paymentMethod,
        count: pm.count,
        totalAmount: pm.totalAmount
      }
    })

    const paymentMethodCanceled = queryPaymentMethodCanceled.length > 0 && queryPaymentMethodCanceled.map(pm => {
      let paymentMethod = getPaymentMethod(pm._id)

      return {
        id: pm._id,
        paymentMethod: paymentMethod,
        count: pm.count,
        totalAmount: pm.totalAmount
      }
    })

    const result = {
      products: products || [],
      productsCanceled: productsCanceled || [],
      paymentMethod: paymentMethod || [],
      paymentMethodCanceled: paymentMethodCanceled || []
    }

    return Result.Success.SuccessOnSearch(res, result)
  }
}
