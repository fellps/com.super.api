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
  menus: [MenuSchema],
  products: [ProductSchema],
  devices: [DeviceSchema]
}, {
  timestamps: true
})

export default mongoose.model('Event', EventSchema)