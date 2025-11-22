const express = require('express');
const { body, validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/patients
// @desc    Get all patients for the authenticated practitioner
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query = { practitioner: req.userId };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { 'personalInfo.name': { $regex: search, $options: 'i' } },
        { 'personalInfo.email': { $regex: search, $options: 'i' } },
        { 'personalInfo.phone': { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const patients = await Patient.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-dietPlans -progress -appointments');

    const total = await Patient.countDocuments(query);

    res.json({
      patients,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ message: 'Server error while fetching patients' });
  }
});

// @route   GET /api/patients/:id
// @desc    Get single patient by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findOne({
      _id: req.params.id,
      practitioner: req.userId
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ message: 'Server error while fetching patient' });
  }
});

// @route   POST /api/patients
// @desc    Create a new patient
// @access  Private
router.post('/', auth, [
  body('personalInfo.name').trim().isLength({ min: 2 }).withMessage('Name is required'),
  body('personalInfo.email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('personalInfo.phone').optional().trim(),
  body('healthProfile.prakriti').isIn(['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha'])
    .withMessage('Valid prakriti is required'),
  body('lifestyle.activityLevel').optional().isIn(['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active']),
  body('lifestyle.stressLevel').optional().isIn(['Low', 'Moderate', 'High', 'Very High'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if patient with same email already exists for this practitioner
    const existingPatient = await Patient.findOne({
      'personalInfo.email': req.body.personalInfo.email,
      practitioner: req.userId
    });

    if (existingPatient) {
      return res.status(400).json({ message: 'Patient with this email already exists' });
    }

    const patient = new Patient({
      ...req.body,
      practitioner: req.userId
    });

    await patient.save();

    res.status(201).json({
      message: 'Patient created successfully',
      patient
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ message: 'Server error while creating patient' });
  }
});

// @route   PUT /api/patients/:id
// @desc    Update a patient
// @access  Private
router.put('/:id', auth, [
  body('personalInfo.name').optional().trim().isLength({ min: 2 }),
  body('personalInfo.email').optional().isEmail().normalizeEmail(),
  body('healthProfile.prakriti').optional().isIn(['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha']),
  body('status').optional().isIn(['Active', 'Inactive', 'Follow-up', 'Discharged'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, practitioner: req.userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({
      message: 'Patient updated successfully',
      patient
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ message: 'Server error while updating patient' });
  }
});

// @route   PATCH /api/patients/:id
// @desc    Update a patient's information
// @access  Private
router.patch('/:id', auth, async (req, res) => {
  try {
    console.log('PATCH /api/patients/:id - Request body:', JSON.stringify(req.body, null, 2));
    console.log('Patient ID:', req.params.id);
    console.log('User ID:', req.userId);

    const patient = await Patient.findOne({
      _id: req.params.id,
      practitioner: req.userId
    });

    if (!patient) {
      console.log('Patient not found for ID:', req.params.id, 'and practitioner:', req.userId);
      return res.status(404).json({ message: 'Patient not found' });
    }

    console.log('Found patient:', patient.personalInfo.name);
    console.log('Current healthProfile:', JSON.stringify(patient.healthProfile, null, 2));

    // Handle dot notation updates (e.g., 'healthProfile.prakriti')
    const updates = Object.entries(req.body).reduce((acc, [key, value]) => {
      if (key.includes('.')) {
        const [parent, ...rest] = key.split('.');
        const childKey = rest.join('.');
        acc[parent] = acc[parent] || {};
        acc[parent][childKey] = value;
      } else {
        acc[key] = value;
      }
      return acc;
    }, {});

    console.log('Processed updates:', JSON.stringify(updates, null, 2));

    // Apply updates to the patient document
    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'healthProfile') {
        // For healthProfile, merge the updates with existing data
        patient.healthProfile = {
          ...patient.healthProfile.toObject(),
          ...value
        };
      } else if (key in patient) {
        patient[key] = value;
      }
    });

    console.log('Updated patient:', JSON.stringify(patient, null, 2));
    
    try {
      const savedPatient = await patient.save();
      console.log('Patient saved successfully');
      res.json(savedPatient);
    } catch (saveError) {
      console.error('Error saving patient:', saveError);
      if (saveError.name === 'ValidationError') {
        const errors = Object.values(saveError.errors).map(err => ({
          field: err.path,
          message: err.message
        }));
        return res.status(400).json({
          message: 'Validation failed',
          errors
        });
      }
      throw saveError;
    }
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ message: 'Server error while updating patient' });
  }
});

// @route   DELETE /api/patients/:id
// @desc    Delete a patient
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findOneAndDelete({
      _id: req.params.id,
      practitioner: req.userId
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ message: 'Server error while deleting patient' });
  }
});

// @route   POST /api/patients/:id/appointments
// @desc    Add appointment for a patient
// @access  Private
router.post('/:id/appointments', auth, [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('type').isIn(['Initial Consultation', 'Follow-up', 'Emergency', 'Diet Review'])
    .withMessage('Valid appointment type is required'),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const patient = await Patient.findOne({
      _id: req.params.id,
      practitioner: req.userId
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    patient.appointments.push(req.body);
    await patient.save();

    res.json({
      message: 'Appointment added successfully',
      appointment: patient.appointments[patient.appointments.length - 1]
    });
  } catch (error) {
    console.error('Add appointment error:', error);
    res.status(500).json({ message: 'Server error while adding appointment' });
  }
});

// @route   POST /api/patients/:id/progress
// @desc    Add progress entry for a patient
// @access  Private
router.post('/:id/progress', auth, [
  body('weight').optional().isNumeric(),
  body('bloodPressure.systolic').optional().isNumeric(),
  body('bloodPressure.diastolic').optional().isNumeric(),
  body('energyLevel').optional().isIn(['Low', 'Moderate', 'High']),
  body('sleepQuality').optional().isIn(['Poor', 'Fair', 'Good', 'Excellent']),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const patient = await Patient.findOne({
      _id: req.params.id,
      practitioner: req.userId
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    patient.progress.push(req.body);
    await patient.save();

    res.json({
      message: 'Progress entry added successfully',
      progress: patient.progress[patient.progress.length - 1]
    });
  } catch (error) {
    console.error('Add progress error:', error);
    res.status(500).json({ message: 'Server error while adding progress entry' });
  }
});

// @route   GET /api/patients/stats/overview
// @desc    Get patient statistics for dashboard
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments({ practitioner: req.userId });
    const activePatients = await Patient.countDocuments({ 
      practitioner: req.userId, 
      status: 'Active' 
    });
    const followUpPatients = await Patient.countDocuments({ 
      practitioner: req.userId, 
      status: 'Follow-up' 
    });

    // Get consultations this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const consultationsThisMonth = await Patient.aggregate([
      { $match: { practitioner: req.userId } },
      { $unwind: '$appointments' },
      { 
        $match: { 
          'appointments.date': { $gte: startOfMonth },
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

    res.json({
      totalPatients,
      activePatients,
      followUpPatients,
      consultationsThisMonth: consultationsThisMonth[0]?.total || 0,
      doshaDistribution
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});

module.exports = router;






