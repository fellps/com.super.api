import mongoose from 'mongoose'
import { MenuSchema } from './menu.model'
import { ProductSchema } from './product.model'
import { DeviceSchema } from './device.model'

export const EventSchema = mongoose.Schema({
  name: String,
  startDate: Date,
  endDate: Date,
  cep: Number,
  state: String,
  city: String,
  address: String,
  addressNumber: Number,
  description: String,
  menus: [MenuSchema],
  products: [ProductSchema],
  devices: [DeviceSchema],
  producerId: String,
  managerPassword: String,
  isEnabled: Boolean
}, {
  timestamps: true
})

export default mongoose.model('Event', EventSchema)