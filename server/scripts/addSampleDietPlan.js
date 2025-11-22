const mongoose = require('mongoose');
const DietPlan = require('../models/DietPlan');
const Patient = require('../models/Patient');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ayurvedic-diet', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Sample summer diet plan for South India
const sampleDietPlan = {
  name: "Summer South India Diet Plan",
  patient: null, // Will be set to first patient
  practitioner: null, // Will be set to first user
  dosha: "Pitta",
  duration: 7,
  status: "Active",
  meals: [
    {
      day: "Monday",
      mealType: "Breakfast",
      foods: [
        { name: "Dosa", quantity: "2", calories: 200 },
        { name: "Coconut Chutney", quantity: "2 tbsp", calories: 50 }
      ]
    },
    {
      day: "Monday",
      mealType: "Lunch",
      foods: [
        { name: "Steamed Rice", quantity: "1 cup", calories: 200 },
        { name: "Sambar", quantity: "1 bowl", calories: 150 },
        { name: "Cucumber Raita", quantity: "1 small bowl", calories: 100 }
      ]
    },
    {
      day: "Monday",
      mealType: "Dinner",
      foods: [
        { name: "Moong Dal Khichdi", quantity: "1.5 cups", calories: 250 },
        { name: "Steamed Vegetables", quantity: "1 cup", calories: 100 }
      ]
    }
  ]
};

async function addSampleDietPlan() {
  try {
    // Get first patient and user
    const patient = await Patient.findOne();
    const User = require('../models/User');
    const user = await User.findOne({ role: 'doctor' });
    
    if (!patient || !user) {
      console.error('Please make sure you have at least one patient and doctor user in the database');
      process.exit(1);
    }

    // Set patient and practitioner
    sampleDietPlan.patient = patient._id;
    sampleDietPlan.practitioner = user._id;

    // Create and save the diet plan
    const dietPlan = new DietPlan(sampleDietPlan);
    await dietPlan.save();
    
    console.log('Sample diet plan added successfully!');
    console.log(`Diet Plan ID: ${dietPlan._id}`);
    
    // Update patient with the new diet plan
    patient.dietPlans.push(dietPlan._id);
    await patient.save();
    
    process.exit(0);
  } catch (error) {
    console.error('Error adding sample diet plan:', error);
    process.exit(1);
  }
}

addSampleDietPlan();
