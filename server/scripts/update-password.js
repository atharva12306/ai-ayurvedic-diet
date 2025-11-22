const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ayurvedic-diet';

async function updatePassword() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('[update] Connected to MongoDB');

    const email = 'doctor@ayurcare.com';
    const newPassword = 'AyurVeda#2024$Secure!';
    
    const user = await User.findOne({ email });
    if (user) {
      user.password = newPassword; // pre-save hook will hash it
      await user.save();
      console.log(`[update] Password updated for: ${email}`);
      console.log(`[update] New password: ${newPassword}`);
    } else {
      console.log(`[update] User not found: ${email}`);
    }

    console.log('[update] Done.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[update] Error:', err);
    process.exit(1);
  }
}

updatePassword();
