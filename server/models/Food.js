const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Grains', 'Legumes', 'Vegetables', 'Fruits', 'Dairy', 'Spices', 'Nuts', 'Seeds', 'Oils', 'Beverages', 'Herbs']
  },
  taste: {
    type: String,
    required: true,
    enum: ['Sweet', 'Sour', 'Salty', 'Pungent', 'Bitter', 'Astringent']
  },
  nutritionalInfo: {
    calories: {
      type: Number,
      required: true
    },
    protein: {
      type: Number,
      required: true
    },
    carbohydrates: {
      type: Number,
      required: true
    },
    fat: {
      type: Number,
      required: true
    },
    fiber: Number,
    sugar: Number,
    sodium: Number,
    potassium: Number,
    calcium: Number,
    iron: Number,
    vitaminC: Number,
    vitaminA: Number
  },
  ayurvedicProperties: {
    digestibility: {
      type: String,
      required: true,
      enum: ['Light', 'Medium', 'Heavy']
    },
    temperature: {
      type: String,
      required: true,
      enum: ['Hot', 'Warm', 'Neutral', 'Cool', 'Cold', 'Cooling']
    },
    doshaCompatibility: {
      vata: {
        type: String,
        enum: ['Excellent', 'Good', 'Moderate', 'Poor'],
        required: true
      },
      pitta: {
        type: String,
        enum: ['Excellent', 'Good', 'Moderate', 'Poor'],
        required: true
      },
      kapha: {
        type: String,
        enum: ['Excellent', 'Good', 'Moderate', 'Poor'],
        required: true
      }
    },
    gunas: [{
      type: String,
      enum: ['Sattvic', 'Rajasic', 'Tamasic']
    }],
    virya: {
      type: String,
      enum: ['Hot', 'Cold']
    },
    vipaka: {
      type: String,
      enum: ['Sweet', 'Sour', 'Pungent']
    }
  },
  description: {
    type: String,
    required: true
  },
  benefits: [String],
  preparation: String,
  contraindications: [String],
  seasonality: [{
    season: {
      type: String,
      enum: ['Spring', 'Summer', 'Monsoon', 'Autumn', 'Winter']
    },
    recommendation: {
      type: String,
      enum: ['Best', 'Good', 'Moderate', 'Avoid']
    }
  }],
  image: String,
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient searching
foodSchema.index({ name: 'text', description: 'text', benefits: 'text' });
foodSchema.index({ category: 1 });
foodSchema.index({ taste: 1 });
foodSchema.index({ 'ayurvedicProperties.digestibility': 1 });
foodSchema.index({ 'ayurvedicProperties.temperature': 1 });
foodSchema.index({ 'ayurvedicProperties.doshaCompatibility.vata': 1 });
foodSchema.index({ 'ayurvedicProperties.doshaCompatibility.pitta': 1 });
foodSchema.index({ 'ayurvedicProperties.doshaCompatibility.kapha': 1 });

module.exports = mongoose.model('Food', foodSchema);






