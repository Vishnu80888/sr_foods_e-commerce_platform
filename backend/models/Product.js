const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  slug:          { type: String, unique: true, lowercase: true },
  tagline:       String,
  description:   { type: String, required: true },
  longDesc:      String,

  category: {
    type: String,
    enum: ['chapati', 'poori', 'special', 'combo'],
    required: true
  },

  price:         { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, required: true },
  unit:          { type: String, default: 'pack' },
  stock:         { type: Number, default: 100, min: 0 },

  badge: String,

  emoji: {
    type: String,
    default: '🍽️'
  },

  color: {
    type: String,
    default: '#E8620A'
  },

  bgColor: {
    type: String,
    default: '#fff5eb'
  },

  // ✅ SINGLE PRODUCT IMAGE
  image: {
    type: String,
    default: ''
  },

  // ✅ MULTIPLE PRODUCT IMAGES (OPTIONAL)
  images: {
    type: [String],
    default: []
  },

  ingredients: String,
  storage: String,
  instructions: String,

  features: {
    type: [String],
    default: []
  },

  nutritionInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },

  rating: {
    type: Number,
    default: 0
  },

  reviewCount: {
    type: Number,
    default: 0
  },

  isFeatured: {
    type: Boolean,
    default: false
  },

  isActive: {
    type: Boolean,
    default: true
  },

  tags: {
    type: [String],
    default: []
  }

}, { timestamps: true });

productSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);