import { Schema, model } from 'mongoose';
const schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: { type: String, required: true, select: false },
  name: { type: String, required: true, trim: true },
});
export default model('User', schema);
