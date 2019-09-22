import mongoose from 'mongoose'

export const UserSchema = mongoose.Schema({
  name: String,
  cpf: { type: Number, select: false },
  birthdate: Date,
  email: String,
  phone: Number,
  password: { type: String, select: false },
  roles: Array
}, {
  timestamps: true
})

export default mongoose.model('User', UserSchema)