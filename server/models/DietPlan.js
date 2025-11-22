const mongoose = require('mongoose');

const dietPlanSchema = new mongoose.Schema({
  practitioner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  dosha: {
    type: String,
    required: true,
    enum: ['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha']
  },
  season: {
    type: String,
    enum: ['Summer', 'Winter', 'Monsoon', 'Spring', 'Autumn', 'All-Season'],
    default: 'All-Season'
  },
  region: {
    type: String,
    enum: ['North', 'South', 'East', 'West', 'Pan-India'],
    default: 'Pan-India'
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  goals: [{
    type: String,
    trim: true
  }],
  restrictions: [{
    type: String,
    trim: true
  }],
  meals: [{
    day: {
      type: String,
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    mealType: {
      type: String,
      required: true,
      enum: ['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Evening Snack', 'Dinner']
    },
    foods: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      quantity: {
        type: String,
        required: true
      },
      calories: {
        type: Number,
        required: true
      },
      protein: Number,
      carbs: Number,
      fat: Number,
      fiber: Number,
      notes: String
    }],
    notes: [String],
    totalCalories: Number
  }],
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Paused', 'Cancelled'],
    default: 'Active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  notes: String,
  tags: [String]
}, {
  timestamps: true
});

// Index for efficient queries
dietPlanSchema.index({ practitioner: 1, patient: 1 });
dietPlanSchema.index({ practitioner: 1, status: 1 });
dietPlanSchema.index({ dosha: 1 });

// Calculate total calories for each meal
dietPlanSchema.pre('save', function(next) {
  this.meals.forEach(meal => {
    meal.totalCalories = meal.foods.reduce((total, food) => total + (food.calories || 0), 0);
  });
  next();
});

module.exports = mongoose.model('DietPlan', dietPlanSchema);






