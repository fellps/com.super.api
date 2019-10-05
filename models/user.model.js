import mongoose from 'mongoose'

export const UserSchema = mongoose.Schema({
  name: String,
  cpf: String,
  birthdate: Date,
  email: String,
  phone: Number,
  password: { type: String, select: false },
  roles: Array,
  isEnabled: Boolean
}, {
  timestamps: true
})

export default mongoose.model('User', UserSchema)