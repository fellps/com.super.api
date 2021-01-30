import mongoose from 'mongoose'

export const DeviceSchema = mongoose.Schema({
  name: String,
  menusIds: [],
  acquirer: String,
  isQRCodeEnabled: Boolean,
  isEnabled: Boolean,
  fromId: String,
}, {
  timestamps: true
})

export default mongoose.model('Device', DeviceSchema)