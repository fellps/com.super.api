import Transaction from '../models/transaction.model'
import Producer from '../models/producer.model'
import mongoose from 'mongoose'
import Result from '../modules/result'

export default {
  // Sales summary report
  salesSummary: async (req, res) => {
    try {
      const queryEvent = await Transaction.aggregate([
        { $match: { eventId: mongoose.Types.ObjectId(req.params.eventId) } },
        { $group: { _id: null, totalEventAmount: { $sum: '$amount' }, totalTransactions: { $sum: 1 } } },
      ])

      const queryPOS = await Transaction.distinct('deviceId', { 
        eventId: mongoose.Types.ObjectId(req.params.eventId)
      })

      const queryPaymentMethod = await Transaction.aggregate([
        { $match: { eventId: mongoose.Types.ObjectId(req.params.eventId) } },
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
          $match: { 'eventId': mongoose.Types.ObjectId(req.params.eventId) }
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
        let paymentMethod = ''

        if (pm._id == '1')
          paymentMethod = 'Crédito'
        else if  (pm._id == '2')
          paymentMethod = 'Débito'
        else if (pm._id == '3')
          paymentMethod = 'Dinheiro'

        return {
          id: pm._id,
          paymentMethod: paymentMethod,
          count: pm.count,
          totalAmount: pm.totalAmount,
          percent: parseInt((pm.count / event.totalTransactions) * 100)
        }
      })

      const producer = await Producer.findOne({
        'events._id': req.params.eventId,
      }, 'events.$').exec()

      const products = queryProducts.shift().products.map(p => {
        const product = producer.events[0].products.id(p.id)
        p['name'] = product.name
        p['percent'] = parseInt((p.totalAmount / event.totalEventAmount) * 100)
        return p
      })
        
      const result = {
        totalEventAmount: event.totalEventAmount,
        totalTransactions: event.totalTransactions,
        totalPOS: queryPOS.length,
        paymentMethod: paymentMethod,
        productSummary: products
      }

      return Result.Success.SuccessOnSearch(res, result)
    } catch (err) {
      return Result.Error.ErrorOnSearch(res, err.message)
    }
  },

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
        p['name'] = product.name
        return p
      })

      const ordersDeliveredByUser = queryOrdersDeliveredByUser.shift().deliveries.map(p => {
        const product = producer.events[0].products.id(p.productId)
        p['name'] = product.name
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
  }
}
