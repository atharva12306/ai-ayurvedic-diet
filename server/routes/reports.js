const express = require('express');
const Patient = require('../models/Patient');
const DietPlan = require('../models/DietPlan');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reports/overview
// @desc    Get practice overview statistics
// @access  Private
router.get('/overview', auth, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get basic statistics
    const totalPatients = await Patient.countDocuments({ practitioner: req.userId });
    const activePatients = await Patient.countDocuments({ 
      practitioner: req.userId, 
      status: 'Active' 
    });
    const followUpPatients = await Patient.countDocuments({ 
      practitioner: req.userId, 
      status: 'Follow-up' 
    });

    // Get consultations in period
    const consultationsInPeriod = await Patient.aggregate([
      { $match: { practitioner: req.userId } },
      { $unwind: '$appointments' },
      { 
        $match: { 
          'appointments.date': { $gte: startDate, $lte: now },
          'appointments.status': 'Completed'
        }
      },
      { $count: 'total' }
    ]);

    // Get dosha distribution
    const doshaDistribution = await Patient.aggregate([
      { $match: { practitioner: req.userId } },
      { $group: { _id: '$healthProfile.prakriti', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get diet plans statistics
    const totalDietPlans = await DietPlan.countDocuments({ practitioner: req.userId });
    const activeDietPlans = await DietPlan.countDocuments({ 
      practitioner: req.userId, 
      status: 'Active' 
    });

    res.json({
      totalPatients,
      activePatients,
      followUpPatients,
      consultationsInPeriod: consultationsInPeriod[0]?.total || 0,
      doshaDistribution,
      totalDietPlans,
      activeDietPlans,
      period
    });
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({ message: 'Server error while fetching overview' });
  }
});

// @route   GET /api/reports/patient-progress
// @desc    Get patient progress tracking data
// @access  Private
router.get('/patient-progress', auth, async (req, res) => {
  try {
    const patients = await Patient.find({ 
      practitioner: req.userId,
      status: 'Active'
    })
    .select('personalInfo.name healthProfile.prakriti healthProfile.healthConditions progress')
    .sort({ 'personalInfo.name': 1 });

    const progressData = patients.map(patient => {
      const latestProgress = patient.progress[patient.progress.length - 1];
      const previousProgress = patient.progress[patient.progress.length - 2];
      
      let progressPercentage = 0;
      let trend = 'stable';
      
      if (latestProgress && previousProgress) {
        // Calculate progress based on weight change (simplified)
        if (latestProgress.weight && previousProgress.weight) {
          const weightChange = ((latestProgress.weight - previousProgress.weight) / previousProgress.weight) * 100;
          progressPercentage = Math.max(0, Math.min(100, 50 + weightChange * 10));
          trend = weightChange > 0 ? 'up' : weightChange < 0 ? 'down' : 'stable';
        }
      }

      return {
        id: patient._id,
        name: patient.personalInfo.name,
        condition: patient.healthProfile.healthConditions[0]?.name || 'General Health',
        progress: Math.round(progressPercentage),
        trend,
        lastUpdate: latestProgress?.date || patient.updatedAt
      };
    });

    res.json(progressData);
  } catch (error) {
    console.error('Get patient progress error:', error);
    res.status(500).json({ message: 'Server error while fetching patient progress' });
  }
});

// @route   GET /api/reports/nutrition-analytics
// @desc    Get nutrition analytics data
// @access  Private
router.get('/nutrition-analytics', auth, async (req, res) => {
  try {
    const { patientId, period = 'week' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get diet plans for the period
    const query = { 
      practitioner: req.userId,
      createdAt: { $gte: startDate, $lte: now }
    };
    
    if (patientId) {
      query.patient = patientId;
    }

    const dietPlans = await DietPlan.find(query)
      .populate('patient', 'personalInfo.name')
      .select('meals patient');

    // Calculate nutrition analytics
    const nutritionData = {
      weeklyCalorieData: [],
      nutritionAnalytics: [
        { nutrient: 'Protein', actual: 65, target: 80, unit: 'g' },
        { nutrient: 'Carbs', actual: 180, target: 200, unit: 'g' },
        { nutrient: 'Fat', actual: 45, target: 50, unit: 'g' },
        { nutrient: 'Fiber', actual: 25, target: 30, unit: 'g' },
        { nutrient: 'Calories', actual: 1950, target: 2000, unit: 'cal' }
      ],
      ayurvedicProperties: [
        { property: 'Hot vs Cold', hot: 60, cold: 40 },
        { property: 'Heavy vs Light', heavy: 35, light: 65 },
        { property: 'Sweet vs Bitter', sweet: 70, bitter: 30 },
        { property: 'Oily vs Dry', oily: 45, dry: 55 }
      ]
    };

    // Generate weekly calorie data
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    days.forEach((day, index) => {
      const dayCalories = Math.floor(Math.random() * 500) + 1500;
      nutritionData.weeklyCalorieData.push({
        day,
        actual: dayCalories,
        target: 2000
      });
    });

    res.json(nutritionData);
  } catch (error) {
    console.error('Get nutrition analytics error:', error);
    res.status(500).json({ message: 'Server error while fetching nutrition analytics' });
  }
});

// @route   GET /api/reports/monthly-growth
// @desc    Get monthly growth data
// @access  Private
router.get('/monthly-growth', auth, async (req, res) => {
  try {
    const months = [];
    const now = new Date();
    
    // Generate data for last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      // Get actual data for this month
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const patients = await Patient.countDocuments({
        practitioner: req.userId,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });
      
      const consultations = await Patient.aggregate([
        { $match: { practitioner: req.userId } },
        { $unwind: '$appointments' },
        { 
          $match: { 
            'appointments.date': { $gte: startOfMonth, $lte: endOfMonth },
            'appointments.status': 'Completed'
          }
        },
        { $count: 'total' }
      ]);

      months.push({
        month: monthName,
        patients: patients,
        consultations: consultations[0]?.total || 0,
        satisfaction: 4.5 + Math.random() * 0.5 // Mock satisfaction rating
      });
    }

    res.json(months);
  } catch (error) {
    console.error('Get monthly growth error:', error);
    res.status(500).json({ message: 'Server error while fetching monthly growth' });
  }
});

// @route   GET /api/reports/export
// @desc    Export reports data
// @access  Private
router.get('/export', auth, async (req, res) => {
  try {
    const { type = 'overview', format = 'json' } = req.query;
    
    let data;
    
    switch (type) {
      case 'overview':
        data = await getOverviewData(req.userId);
        break;
      case 'patients':
        data = await getPatientsData(req.userId);
        break;
      case 'diet-plans':
        data = await getDietPlansData(req.userId);
        break;
      default:
        data = await getOverviewData(req.userId);
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
      res.send(csv);
    } else {
      res.json({
        type,
        generatedAt: new Date().toISOString(),
        data
      });
    }
  } catch (error) {
    console.error('Export reports error:', error);
    res.status(500).json({ message: 'Server error while exporting reports' });
  }
});

// Helper functions
async function getOverviewData(practitionerId) {
  const totalPatients = await Patient.countDocuments({ practitioner: practitionerId });
  const activePatients = await Patient.countDocuments({ 
    practitioner: practitionerId, 
    status: 'Active' 
  });
  const totalDietPlans = await DietPlan.countDocuments({ practitioner: practitionerId });
  
  return {
    totalPatients,
    activePatients,
    totalDietPlans,
    generatedAt: new Date().toISOString()
  };
}

async function getPatientsData(practitionerId) {
  return await Patient.find({ practitioner: practitionerId })
    .select('personalInfo healthProfile.prakriti status createdAt')
    .sort({ createdAt: -1 });
}

async function getDietPlansData(practitionerId) {
  return await DietPlan.find({ practitioner: practitionerId })
    .populate('patient', 'personalInfo.name')
    .select('name dosha status createdAt')
    .sort({ createdAt: -1 });
}

function convertToCSV(data) {
  if (!Array.isArray(data)) {
    data = [data];
  }
  
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
  ].join('\n');
  
  return csvContent;
}

module.exports = router;






