const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  practitioner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  personalInfo: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    dateOfBirth: {
      type: Date
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other']
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  healthProfile: {
    prakriti: {
      type: String,
      enum: ['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha'],
      required: true
    },
    vikriti: {
      type: String,
      enum: ['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha']
    },
    healthConditions: [{
      name: String,
      severity: {
        type: String,
        enum: ['Mild', 'Moderate', 'Severe']
      },
      diagnosedDate: Date,
      notes: String
    }],
    allergies: [{
      allergen: String,
      severity: {
        type: String,
        enum: ['Mild', 'Moderate', 'Severe']
      },
      reaction: String
    }],
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      startDate: Date,
      notes: String
    }]
  },
  lifestyle: {
    activityLevel: {
      type: String,
      enum: ['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active']
    },
    sleepPattern: {
      bedtime: String,
      wakeTime: String,
      quality: {
        type: String,
        enum: ['Poor', 'Fair', 'Good', 'Excellent']
      }
    },
    dietPreferences: [String],
    exerciseRoutine: String,
    stressLevel: {
      type: String,
      enum: ['Low', 'Moderate', 'High', 'Very High']
    }
  },
  appointments: [{
    date: {
      type: Date,
      required: true
    },
    type: {
      type: String,
      enum: ['Initial Consultation', 'Follow-up', 'Emergency', 'Diet Review'],
      required: true
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
      default: 'Scheduled'
    },
    notes: String,
    recommendations: String
  }],
  dietPlans: [{
    name: String,
    dosha: String,
    startDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Paused', 'Cancelled'],
      default: 'Active'
    },
    meals: [{
      day: String,
      mealType: String,
      foods: [{
        name: String,
        quantity: String,
        calories: Number,
        notes: String
      }],
      notes: String
    }],
    goals: [String],
    restrictions: [String]
  }],
  progress: [{
    date: {
      type: Date,
      default: Date.now
    },
    weight: Number,
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    symptoms: [String],
    energyLevel: {
      type: String,
      enum: ['Low', 'Moderate', 'High']
    },
    sleepQuality: {
      type: String,
      enum: ['Poor', 'Fair', 'Good', 'Excellent']
    },
    notes: String
  }],
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Follow-up', 'Discharged'],
    default: 'Active'
  },
  notes: String,
  tags: [String]
}, {
  timestamps: true
});

// Index for efficient queries
patientSchema.index({ practitioner: 1, 'personalInfo.email': 1 });
patientSchema.index({ practitioner: 1, status: 1 });
patientSchema.index({ 'healthProfile.prakriti': 1 });

module.exports = mongoose.model('Patient', patientSchema);






