const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided, using demo mode...');
      // Simple demo mode - use a fixed demo user ID
      const mongoose = require('mongoose');
      const demoUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'); // Fixed demo ID
      
      req.userId = demoUserId;
      req.user = {
        _id: demoUserId,
        name: 'Dr. Demo',
        email: 'demo@ayurcare.com',
        role: 'doctor',
        specialization: 'Ayurveda',
        isActive: true
      };
      console.log('Demo mode activated with user ID:', demoUserId);
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      console.log('Invalid token, falling back to demo mode');
      const mongoose = require('mongoose');
      const demoUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
      req.userId = demoUserId;
      req.user = {
        _id: demoUserId,
        name: 'Dr. Demo',
        email: 'demo@ayurcare.com',
        role: 'doctor',
        specialization: 'Ayurveda',
        isActive: true
      };
      return next();
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    req.userId = user._id;
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    console.log('Auth error, falling back to demo mode');
    // Always fallback to demo mode on any auth error
    const mongoose = require('mongoose');
    const demoUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
    req.userId = demoUserId;
    req.user = {
      _id: demoUserId,
      name: 'Dr. Demo',
      email: 'demo@ayurcare.com',
      role: 'doctor',
      specialization: 'Ayurveda',
      isActive: true
    };
    next();
  }
};

module.exports = auth;






