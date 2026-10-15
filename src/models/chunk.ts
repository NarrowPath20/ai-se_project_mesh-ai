import { Schema, model } from 'mongoose';
const schema = new Schema({
  documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true },
  text: { type: String, required: true },
  embedding: { type: [Number], default: [] },
  createdAt: { type: Date, default: Date.now },
});
export default model('Chunk', schema);
