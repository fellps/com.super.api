import Transaction from '../models/transaction.model'
import Producer from '../models/producer.model'
import mongoose from 'mongoose'
import Result from '../modules/result'

export default {
  // Financial report
  financial: async (req, res) => {
    try {
      const eventData = await Transaction.aggregate([
        { $match: { eventId: mongoose.Types.ObjectId(req.params.eventId) } },
        { $group: { _id: null, totalEventAmount: { $sum: '$amount' }, totalTransactions: { $sum: 1 } } },
      ]).exec()

      const totalPOSData = await Transaction.distinct('deviceId').exec()

      const paymentMethodData = await Transaction.aggregate([
        { $match: { eventId: mongoose.Types.ObjectId(req.params.eventId) } },
        {
          $group: {
            _id: {$toLower: '$paymentMethod'},
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ])
        
      const productsData = await Transaction.aggregate([
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
      ]).exec()

      const event = eventData.shift()

      const paymentMethod = paymentMethodData.map(pm => {
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

      const products = productsData.shift().products.map(p => {
        const product = producer.events[0].products.id(p.id)
        p['name'] = product.name
        p['percent'] = parseInt((p.totalAmount / event.totalEventAmount) * 100)
        return p
      })
        
      const result = {
        totalEventAmount: event.totalEventAmount,
        totalTransactions: event.totalTransactions,
        totalPOS: totalPOSData.length,
        paymentMethod: paymentMethod,
        productSummary: products
      }

      return Result.Success.SuccessOnSearch(res, result)
    } catch (err) {
      return Result.Error.ErrorOnSearch(res, err.message)
    }
  }
}
