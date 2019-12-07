import mongoose from 'mongoose'
import { EventSchema } from './event.model'

export const ProducerSchema = mongoose.Schema({
  socialReason: String,
  cnpj: String,
  cep: String,
  state: String,
  city: String,
  address: String,
  addressNumber: String,
  email: String,
  phone: String,
  events: [EventSchema],
  isEnabled: Boolean,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

export default mongoose.model('Producer', ProducerSchema)