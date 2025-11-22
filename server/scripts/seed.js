const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ayurvedic-diet';

async function main() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('[seed] Connected to MongoDB');

    // Create/update doctor account with simple password
    const email = 'doctor@ayurcare.com';
    const password = 'Test@123'; // Simple password for testing
    
    // Delete if exists to avoid duplicates
    await User.deleteOne({ email });
    
    // Create new user
    const user = new User({
      name: 'Dr. Ayurvedic Practitioner',
      email,
      password, // pre-save hook will hash
      role: 'doctor',
      specialization: 'AI-Powered Ayurveda & Nutrition',
      licenseNumber: 'AIAYUSH-2024-001',
      phone: '+1 555 987 6543',
    });
    await user.save();
    console.log(`[seed] Created user: ${email} / ${password} (role: doctor)`);

    console.log('[seed] Done.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[seed] Error:', err);
    process.exit(1);
  }
}

main();
