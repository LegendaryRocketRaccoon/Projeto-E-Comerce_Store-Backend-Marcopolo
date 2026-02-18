/*const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, index: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
  ancestors: [{
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    slug: String,
    name: String
  }],
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

CategorySchema.pre('save', async function (next) {
  if (!this.isModified('parentId') && !this.isNew) return next();

  if (!this.parentId) {
    this.ancestors = [];
    return next();
  }

  const Category = this.constructor;
  const parent = await Category.findById(this.parentId).lean();
  if (!parent) return next(new Error('parentId inválido'));

  this.ancestors = [
    ...(parent.ancestors || []),
    { _id: parent._id, slug: parent.slug, name: parent.name }
  ];
  next();
});

module.exports = mongoose.model('Category', CategorySchema);
``*/