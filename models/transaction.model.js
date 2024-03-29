import mongoose from 'mongoose'
import { ProductSchema } from './product.model'

export const TransactionSchema = mongoose.Schema({
  _id : { type : String, required : true },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device'
  },
  products: [ProductSchema],
  terminalCode: String,
  amount: Number,
  paymentMethod: Number,
  loggedUserDocument: String,
  cardTransactionCode: String,
  cardTransactionId: String,
  cardAuthorizationCode: String,
  cardBin: String,
  cardHolder: String,
  cardBrandCode: String,
  isDelivered: Boolean,
  deliveryUser: String,
  createdAt: Date,
  canceledAt: Date
}, {
  timestamps: true
})

export default mongoose.model('Transaction', TransactionSchema)