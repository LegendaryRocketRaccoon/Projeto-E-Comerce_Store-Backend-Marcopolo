/*const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  fakestoreId: {
    type: Number,
    unique: true,
    sparse: true,
    index: true
  },
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, sparse: true, lowercase: true, index: true },
  price: { type: Number, required: true, min: 0, index: true },
  description: { type: String, required: true },

  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true }],

  image: { type: String, required: true },
  rating: {
    rate: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ price: 1 });

module.exports = mongoose.model('Product', productSchema);
``*/