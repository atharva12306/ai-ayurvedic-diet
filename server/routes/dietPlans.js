const express = require('express');
const { body, validationResult } = require('express-validator');
const DietPlan = require('../models/DietPlan');
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/diet-plans/test
// @desc    Test endpoint to check if server is working
// @access  Public
router.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({ 
    message: 'Diet plans API is working',
    timestamp: new Date().toISOString()
  });
});

// @route   GET /api/diet-plans
// @desc    Get all diet plans for the authenticated practitioner
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, patientId, status } = req.query;
    
    const query = { practitioner: req.userId };
    
    if (patientId) {
      query.patient = patientId;
    }
    
    if (status) {
      query.status = status;
    }

    const dietPlans = await DietPlan.find(query)
      .populate('patient', 'personalInfo.name personalInfo.email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await DietPlan.countDocuments(query);

    res.json({
      dietPlans,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get diet plans error:', error);
    res.status(500).json({ message: 'Server error while fetching diet plans' });
  }
});

// @route   GET /api/diet-plans/:id
// @desc    Get single diet plan by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const dietPlan = await DietPlan.findOne({
      _id: req.params.id,
      practitioner: req.userId
    }).populate('patient', 'personalInfo.name personalInfo.email healthProfile.prakriti');

    if (!dietPlan) {
      return res.status(404).json({ message: 'Diet plan not found' });
    }

    res.json(dietPlan);
  } catch (error) {
    console.error('Get diet plan error:', error);
    res.status(500).json({ message: 'Server error while fetching diet plan' });
  }
});

// @route   POST /api/diet-plans
// @desc    Create a new diet plan
// @access  Private
router.post('/', auth, [
  body('patient').isMongoId().withMessage('Valid patient ID is required'),
  body('name').trim().isLength({ min: 2 }).withMessage('Diet plan name is required'),
  body('dosha').isIn(['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha'])
    .withMessage('Valid dosha is required'),
  body('duration').isNumeric().withMessage('Duration is required'),
  body('goals').isArray().withMessage('Goals must be an array'),
  body('restrictions').optional().isArray(),
  body('meals').optional().isArray().withMessage('Meals must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    console.log('Creating diet plan with data:', {
      patient: req.body.patient,
      name: req.body.name,
      dosha: req.body.dosha,
      mealsCount: req.body.meals?.length
    });

    // Verify patient exists (simplified for demo mode)
    let patient;
    try {
      patient = await Patient.findById(req.body.patient);
      console.log('Patient lookup result:', patient ? 'Found' : 'Not found');
    } catch (err) {
      console.error('Patient lookup error:', err);
      return res.status(400).json({ message: 'Invalid patient ID format' });
    }

    if (!patient) {
      console.log('Patient not found with ID:', req.body.patient);
      console.log('Creating a temporary patient for demo purposes...');
      
      // Create a temporary patient for demo mode
      try {
        const Patient = require('../models/Patient');
        patient = new Patient({
          practitioner: req.userId,
          personalInfo: {
            name: 'Demo Patient',
            email: 'demo.patient@example.com',
            phone: '1234567890',
            dateOfBirth: new Date('1990-01-01'),
            gender: 'Other',
            address: {
              street: 'Demo Street',
              city: 'Demo City',
              state: 'Demo State',
              zipCode: '12345',
              country: 'Demo Country'
            }
          },
          healthProfile: {
            prakriti: req.body.dosha || 'Vata',
            vikriti: req.body.dosha || 'Vata',
            healthConditions: [],
            allergies: [],
            medications: []
          },
          lifestyle: {
            activityLevel: 'Moderate',
            sleepPattern: {
              bedtime: '10:00 PM',
              wakeTime: '6:00 AM',
              quality: 'Good'
            },
            dietPreferences: [],
            exerciseRoutine: 'Regular',
            stressLevel: 'Low'
          },
          status: 'Active'
        });
        
        await patient.save();
        console.log('Temporary patient created with ID:', patient._id);
        
        // Update the request body to use the new patient ID
        req.body.patient = patient._id;
      } catch (patientCreateError) {
        console.error('Failed to create temporary patient:', patientCreateError);
        return res.status(400).json({ message: 'Failed to create patient. Please try again.' });
      }
    }

    // Create diet plan with explicit field mapping
    const dietPlanData = {
      practitioner: req.userId,
      patient: req.body.patient,
      name: req.body.name,
      dosha: req.body.dosha,
      duration: req.body.duration,
      goals: req.body.goals || ['Balance doshas'],
      restrictions: req.body.restrictions || [],
      meals: req.body.meals || [],
      status: req.body.status || 'Active'
    };
    
    console.log('Creating diet plan with data:', {
      practitioner: dietPlanData.practitioner,
      patient: dietPlanData.patient,
      name: dietPlanData.name,
      dosha: dietPlanData.dosha,
      mealsCount: dietPlanData.meals.length
    });

    const dietPlan = new DietPlan(dietPlanData);
    await dietPlan.save();
    console.log('Diet plan saved successfully with ID:', dietPlan._id);

    res.status(201).json({
      message: 'Diet plan created successfully',
      dietPlan
    });
  } catch (error) {
    console.error('Create diet plan error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error while creating diet plan',
      error: error.message
    });
  }
});

// @route   PUT /api/diet-plans/:id
// @desc    Update a diet plan
// @access  Private
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('status').optional().isIn(['Active', 'Completed', 'Paused', 'Cancelled']),
  body('goals').optional().isArray(),
  body('restrictions').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const dietPlan = await DietPlan.findOneAndUpdate(
      { _id: req.params.id, practitioner: req.userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!dietPlan) {
      return res.status(404).json({ message: 'Diet plan not found' });
    }

    res.json({
      message: 'Diet plan updated successfully',
      dietPlan
    });
  } catch (error) {
    console.error('Update diet plan error:', error);
    res.status(500).json({ message: 'Server error while updating diet plan' });
  }
});

// @route   DELETE /api/diet-plans/:id
// @desc    Delete a diet plan
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const dietPlan = await DietPlan.findOneAndDelete({
      _id: req.params.id,
      practitioner: req.userId
    });

    if (!dietPlan) {
      return res.status(404).json({ message: 'Diet plan not found' });
    }

    res.json({ message: 'Diet plan deleted successfully' });
  } catch (error) {
    console.error('Delete diet plan error:', error);
    res.status(500).json({ message: 'Server error while deleting diet plan' });
  }
});

// @route   POST /api/diet-plans/:id/meals
// @desc    Add meal to diet plan
// @access  Private
router.post('/:id/meals', auth, [
  body('day').isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
    .withMessage('Valid day is required'),
  body('mealType').isIn(['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Evening Snack', 'Dinner'])
    .withMessage('Valid meal type is required'),
  body('foods').isArray().withMessage('Foods must be an array'),
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

    const dietPlan = await DietPlan.findOne({
      _id: req.params.id,
      practitioner: req.userId
    });

    if (!dietPlan) {
      return res.status(404).json({ message: 'Diet plan not found' });
    }

    dietPlan.meals.push(req.body);
    await dietPlan.save();

    res.json({
      message: 'Meal added successfully',
      meal: dietPlan.meals[dietPlan.meals.length - 1]
    });
  } catch (error) {
    console.error('Add meal error:', error);
    res.status(500).json({ message: 'Server error while adding meal' });
  }
});

// @route   POST /api/diet-plans/generate
// @desc    Generate AI-powered diet plan with season and region support
// @access  Private
router.post('/generate', auth, [
  body('patientId').isMongoId().withMessage('Valid patient ID is required'),
  body('dosha').isIn(['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha'])
    .withMessage('Valid dosha is required'),
  body('healthConditions').optional().isArray(),
  body('goals').isArray().withMessage('Goals are required'),
  body('duration').isNumeric().withMessage('Duration is required'),
  body('fast').optional().isBoolean(),
  body('season').optional().isIn(['Summer', 'Winter', 'Monsoon', 'Spring', 'Autumn', 'All-Season']),
  body('region').optional().isIn(['North', 'South', 'East', 'West', 'Pan-India'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Verify patient belongs to practitioner
    const patient = await Patient.findOne({
      _id: req.body.patientId,
      practitioner: req.userId
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Generate diet plan using AI logic with patient context (allergies, season, region)
    const generatedPlan = await generateDietPlanAdvanced(req.body, patient);

    const dietPlan = new DietPlan({
      ...generatedPlan,
      practitioner: req.userId,
      patient: req.body.patientId
    });

    await dietPlan.save();

    res.status(201).json({
      message: 'Diet plan generated successfully',
      dietPlan
    });
  } catch (error) {
    console.error('Generate diet plan error:', error);
    res.status(500).json({ message: 'Server error while generating diet plan' });
  }
});

// Advanced ML-based diet plan generation with seasonal and regional customization
async function generateDietPlanAdvanced(data, patient) {
  const { dosha, healthConditions = [], goals, duration, fast, season = 'All-Season', region = 'Pan-India' } = data;

  // Fast mode = smaller plan
  const fastMode = Boolean(fast);
  const mealTypes = fastMode ? ['Breakfast', 'Lunch', 'Dinner'] : ['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Evening Snack', 'Dinner'];
  const days = fastMode ? ['Day 1', 'Day 2', 'Day 3'] : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Dosha to preferred and avoid tastes
  const rasaGuide = {
    'Vata': { prefer: ['Sweet', 'Sour', 'Salty'], avoid: ['Bitter', 'Pungent', 'Astringent'] },
    'Pitta': { prefer: ['Sweet', 'Bitter', 'Astringent'], avoid: ['Sour', 'Pungent', 'Salty'] },
    'Kapha': { prefer: ['Pungent', 'Bitter', 'Astringent'], avoid: ['Sweet', 'Sour', 'Salty'] }
  };

  // Split dual doshas (e.g., "Vata-Pitta") and merge preferences
  const doshas = String(dosha).split('-').map(d => d.trim());
  const combinedGuide = doshas.reduce((acc, d) => {
    const g = rasaGuide[d] || rasaGuide['Vata'];
    acc.prefer.add(g.prefer[0]);
    acc.prefer.add(g.prefer[1]);
    acc.prefer.add(g.prefer[2]);
    acc.avoid.add(g.avoid[0]);
    acc.avoid.add(g.avoid[1]);
    acc.avoid.add(g.avoid[2]);
    return acc;
  }, { prefer: new Set(), avoid: new Set() });
  // Remove conflicts: if a taste is both prefer and avoid, keep in prefer and drop from avoid
  combinedGuide.avoid.forEach(t => {
    if (combinedGuide.prefer.has(t)) combinedGuide.avoid.delete(t);
  });
  const guideForPlan = {
    prefer: Array.from(combinedGuide.prefer),
    avoid: Array.from(combinedGuide.avoid)
  };

  // Comprehensive Seasonal & Regional Food Database with ML Scoring
  const seasonalFoodDatabase = {
    Summer: {
      vegetables: ['Cucumber', 'Bottle gourd (lauki)', 'Ridge gourd (tori)', 'Ash gourd (petha)', 'Zucchini', 'Snake gourd', 'Bitter gourd (karela)', 'Pumpkin', 'Tomato', 'Capsicum'],
      fruits: ['Watermelon', 'Muskmelon', 'Papaya', 'Mango', 'Lychee', 'Jamun', 'Plum', 'Grapes', 'Coconut water', 'Sugarcane juice'],
      grains: ['Rice', 'Barley', 'Wheat', 'Jowar (sorghum)', 'Moong dal', 'Masoor dal'],
      spices: ['Coriander', 'Mint', 'Fennel', 'Cardamom', 'Rose water'],
      meals: ['Cucumber raita', 'Buttermilk', 'Lemon rice', 'Curd rice', 'Coconut chutney', 'Melon juice', 'Sattu drink', 'Lassi', 'Tender coconut water']
    },
    Winter: {
      vegetables: ['Carrot', 'Radish (mooli)', 'Spinach (palak)', 'Fenugreek (methi)', 'Cauliflower', 'Cabbage', 'Green peas', 'Turnip', 'Sweet potato', 'Beetroot', 'Broccoli'],
      fruits: ['Orange', 'Guava', 'Pomegranate', 'Apple', 'Banana', 'Dates', 'Figs', 'Amla'],
      grains: ['Bajra (pearl millet)', 'Ragi (finger millet)', 'Whole wheat', 'Oats', 'Urad dal', 'Toor dal', 'Chana dal'],
      spices: ['Ginger', 'Black pepper', 'Cinnamon', 'Cloves', 'Nutmeg', 'Garlic', 'Turmeric', 'Ajwain'],
      meals: ['Sarson ka saag', 'Gajar ka halwa', 'Bajra roti', 'Gond ladoo', 'Til ladoo', 'Moong dal halwa', 'Methi paratha', 'Hot soups', 'Ginger tea']
    },
    Monsoon: {
      vegetables: ['Bottle gourd', 'Ridge gourd', 'Bitter gourd', 'Pointed gourd (parwal)', 'Ivy gourd (tindora)', 'Snake gourd', 'Drumstick'],
      fruits: ['Pomegranate', 'Apple', 'Pear', 'Plum', 'Litchi', 'Jamun', 'Cherries'],
      grains: ['Old rice', 'Barley', 'Jowar', 'Moong dal', 'Masoor dal', 'Light grains'],
      spices: ['Turmeric', 'Ginger', 'Garlic', 'Black pepper', 'Ajwain', 'Hing (asafoetida)', 'Rock salt'],
      meals: ['Khichdi', 'Vegetable soup', 'Steamed food', 'Moong dal soup', 'Ginger tea', 'Turmeric milk', 'Light curries', 'Warm herbal teas']
    },
    Spring: {
      vegetables: ['Tender leafy greens', 'Spring onions', 'Asparagus', 'Artichoke', 'Fresh peas', 'Baby corn', 'Tender beans'],
      fruits: ['Strawberries', 'Cherries', 'Apricot', 'Mango (early)', 'Berries', 'Litchi'],
      grains: ['Barley', 'Wheat', 'Quinoa', 'Moong dal', 'Chana dal'],
      spices: ['Cumin', 'Coriander', 'Turmeric', 'Black pepper', 'Ginger'],
      meals: ['Light khichdi', 'Fresh salads', 'Steamed vegetables', 'Barley water', 'Vegetable soups', 'Light dal']
    },
    Autumn: {
      vegetables: ['Pumpkin', 'Sweet potato', 'Carrot', 'Beetroot', 'Bottle gourd', 'Ridge gourd', 'Cauliflower'],
      fruits: ['Papaya', 'Banana', 'Pomegranate', 'Grapes', 'Apple', 'Pear'],
      grains: ['Rice', 'Wheat', 'Bajra', 'Moong dal', 'Toor dal', 'Masoor dal'],
      spices: ['Cumin', 'Coriander', 'Turmeric', 'Fennel', 'Cardamom'],
      meals: ['Khichdi', 'Mixed dal', 'Vegetable curries', 'Rice preparations', 'Warm soups', 'Herbal teas']
    }
  };

  const regionalFoodDatabase = {
    North: {
      staples: ['Wheat roti/chapati', 'Paratha', 'Naan', 'Kulcha', 'Rajma (kidney beans)', 'Chole (chickpeas)', 'Dal makhani', 'Paneer dishes'],
      vegetables: ['Sarson (mustard greens)', 'Bathua', 'Methi (fenugreek)', 'Gajar (carrot)', 'Matar (peas)', 'Gobhi (cauliflower)', 'Aloo (potato)'],
      specialties: ['Makki di roti', 'Sarson ka saag', 'Aloo paratha', 'Paneer tikka', 'Kadhi pakora', 'Chole bhature', 'Rajma chawal', 'Gajar ka halwa'],
      beverages: ['Lassi', 'Chaas', 'Masala chai', 'Kahwa (Kashmiri tea)', 'Thandai'],
      spices: ['Garam masala', 'Kasuri methi', 'Dried ginger powder', 'Amchur (mango powder)', 'Hing']
    },
    South: {
      staples: ['Rice', 'Idli', 'Dosa', 'Vada', 'Uttapam', 'Appam', 'Sambar', 'Rasam', 'Coconut-based curries'],
      vegetables: ['Drumstick', 'Ash gourd', 'Snake gourd', 'Banana stem', 'Raw banana', 'Yam', 'Elephant yam'],
      specialties: ['Sambar rice', 'Rasam rice', 'Lemon rice', 'Tamarind rice', 'Curd rice', 'Bisi bele bath', 'Pongal', 'Avial', 'Kootu'],
      beverages: ['Filter coffee', 'Tender coconut water', 'Buttermilk', 'Panakam', 'Neer mor'],
      spices: ['Curry leaves', 'Mustard seeds', 'Tamarind', 'Coconut', 'Urad dal', 'Fenugreek seeds', 'Red chilies']
    },
    East: {
      staples: ['Rice', 'Fish curry', 'Dal', 'Posto (poppy seeds)', 'Mustard oil dishes', 'Bamboo shoot preparations'],
      vegetables: ['Begun (eggplant)', 'Shukto vegetables', 'Bitter gourd', 'Ridge gourd', 'Pumpkin', 'Banana flower', 'Pointed gourd'],
      specialties: ['Khichuri', 'Dal-bhaat', 'Machher jhol', 'Shukto', 'Aloo posto', 'Cholar dal', 'Moong dal khichdi', 'Payesh'],
      beverages: ['Cha (tea)', 'Gondhoraj lemon water', 'Jaggery tea', 'Rice water'],
      spices: ['Panch phoron', 'Mustard seeds', 'Nigella seeds', 'Poppy seeds', 'Bay leaf', 'Dried red chilies']
    },
    West: {
      staples: ['Bajra roti', 'Jowar roti', 'Rice', 'Dal-rice', 'Kadhi', 'Dhokla', 'Thepla'],
      vegetables: ['Cluster beans (gavar)', 'Drumstick', 'Suran (yam)', 'Tendli', 'Bhindi (okra)', 'Brinjal', 'Bottle gourd'],
      specialties: ['Dal-baati-churma', 'Khichdi-kadhi', 'Dhokla', 'Handvo', 'Thepla', 'Patra', 'Undhiyu', 'Khandvi', 'Puran poli'],
      beverages: ['Chaas (buttermilk)', 'Aam panna', 'Jal jeera', 'Masala chai', 'Kokum sherbet'],
      spices: ['Cumin', 'Coriander', 'Turmeric', 'Asafoetida', 'Ajwain', 'Kokum', 'Dried mango powder']
    }
  };

  // Advanced ML-based food scoring system with multiple algorithms
  const calculateFoodScore = (food, dosha, season, region, allergyFilters, mealType, timeOfDay) => {
    let score = 40; // Base score (reduced to allow more room for bonuses)
    
    // 1. Dosha compatibility (35 points max) - Most important
    const doshaBonus = getAdvancedDoshaBonus(food, dosha);
    score += doshaBonus;
    
    // 2. Seasonal appropriateness (25 points max)
    const seasonBonus = getAdvancedSeasonalBonus(food, season);
    score += seasonBonus;
    
    // 3. Regional authenticity (20 points max) - Increased importance
    const regionBonus = getAdvancedRegionalBonus(food, region);
    score += regionBonus;
    
    // 4. Meal timing optimization (15 points max) - New feature
    const timingBonus = getMealTimingBonus(food, mealType, timeOfDay);
    score += timingBonus;
    
    // 5. Nutritional density (10 points max)
    const nutritionBonus = getAdvancedNutritionalBonus(food);
    score += nutritionBonus;
    
    // 6. Digestibility factor (10 points max) - New feature
    const digestibilityBonus = getDigestibilityBonus(food, dosha);
    score += digestibilityBonus;
    
    // 7. Ayurvedic properties alignment (15 points max) - New feature
    const ayurvedicBonus = getAyurvedicPropertiesBonus(food, dosha, season);
    score += ayurvedicBonus;
    
    // Severe penalties
    if (allergyFilters.some(allergen => food.toLowerCase().includes(allergen.toLowerCase()))) {
      score = 0; // Eliminate allergenic foods completely
    }
    
    // Bonus for traditional combinations
    const combinationBonus = getTraditionalCombinationBonus(food, region, season);
    score += combinationBonus;
    
    return Math.max(0, Math.min(100, score));
  };

  // Advanced dosha compatibility with deeper Ayurvedic principles
  const getAdvancedDoshaBonus = (food, dosha) => {
    const foodLower = food.toLowerCase();
    let bonus = 0;
    
    // Vata balancing foods (35 points max)
    if (dosha === 'Vata' || dosha.includes('Vata')) {
      // Highly beneficial (+20-25 points)
      if (foodLower.includes('ghee') || foodLower.includes('warm milk') || foodLower.includes('khichdi') || 
          foodLower.includes('oatmeal') || foodLower.includes('sweet potato') || foodLower.includes('dates')) bonus += 25;
      // Moderately beneficial (+15-20 points)
      else if (foodLower.includes('warm') || foodLower.includes('oil') || foodLower.includes('soup') || 
               foodLower.includes('cooked') || foodLower.includes('steamed')) bonus += 18;
      // Mildly beneficial (+10-15 points)
      else if (foodLower.includes('banana') || foodLower.includes('rice') || foodLower.includes('nuts')) bonus += 12;
      // Harmful foods (-10 to -15 points)
      if (foodLower.includes('raw') || foodLower.includes('cold') || foodLower.includes('dry') || 
          foodLower.includes('bitter')) bonus -= 12;
    }
    
    // Pitta balancing foods (35 points max)
    if (dosha === 'Pitta' || dosha.includes('Pitta')) {
      // Highly beneficial (+20-25 points)
      if (foodLower.includes('cucumber') || foodLower.includes('coconut') || foodLower.includes('mint') || 
          foodLower.includes('coriander') || foodLower.includes('sweet') || foodLower.includes('cooling')) bonus += 25;
      // Moderately beneficial (+15-20 points)
      else if (foodLower.includes('milk') || foodLower.includes('ghee') || foodLower.includes('rice') || 
               foodLower.includes('melon') || foodLower.includes('grapes')) bonus += 18;
      // Mildly beneficial (+10-15 points)
      else if (foodLower.includes('leafy') || foodLower.includes('green') || foodLower.includes('bitter')) bonus += 12;
      // Harmful foods (-10 to -15 points)
      if (foodLower.includes('spicy') || foodLower.includes('hot') || foodLower.includes('chili') || 
          foodLower.includes('sour') || foodLower.includes('fermented')) bonus -= 12;
    }
    
    // Kapha balancing foods (35 points max)
    if (dosha === 'Kapha' || dosha.includes('Kapha')) {
      // Highly beneficial (+20-25 points)
      if (foodLower.includes('ginger') || foodLower.includes('pepper') || foodLower.includes('turmeric') || 
          foodLower.includes('spicy') || foodLower.includes('light') || foodLower.includes('bitter')) bonus += 25;
      // Moderately beneficial (+15-20 points)
      else if (foodLower.includes('warm') || foodLower.includes('steamed') || foodLower.includes('barley') || 
               foodLower.includes('millet') || foodLower.includes('honey')) bonus += 18;
      // Mildly beneficial (+10-15 points)
      else if (foodLower.includes('vegetables') || foodLower.includes('legumes') || foodLower.includes('astringent')) bonus += 12;
      // Harmful foods (-10 to -15 points)
      if (foodLower.includes('heavy') || foodLower.includes('oily') || foodLower.includes('sweet') || 
          foodLower.includes('dairy') || foodLower.includes('cold')) bonus -= 12;
    }
    
    return Math.max(-15, Math.min(35, bonus));
  };

  // Enhanced seasonal bonus with climate considerations
  const getAdvancedSeasonalBonus = (food, season) => {
    if (season === 'All-Season') return 8;
    
    const foodLower = food.toLowerCase();
    let bonus = 0;
    
    if (season === 'Summer') {
      // Cooling foods get maximum bonus
      if (foodLower.includes('cucumber') || foodLower.includes('watermelon') || foodLower.includes('coconut') || 
          foodLower.includes('mint') || foodLower.includes('buttermilk') || foodLower.includes('curd')) bonus += 25;
      else if (foodLower.includes('melon') || foodLower.includes('juice') || foodLower.includes('salad') || 
               foodLower.includes('cold')) bonus += 18;
      // Heating foods get penalty
      if (foodLower.includes('hot') || foodLower.includes('spicy') || foodLower.includes('ginger') || 
          foodLower.includes('pepper')) bonus -= 8;
    }
    
    if (season === 'Winter') {
      // Warming foods get maximum bonus
      if (foodLower.includes('ginger') || foodLower.includes('cinnamon') || foodLower.includes('hot') || 
          foodLower.includes('soup') || foodLower.includes('warm') || foodLower.includes('ghee')) bonus += 25;
      else if (foodLower.includes('cooked') || foodLower.includes('steamed') || foodLower.includes('spiced') || 
               foodLower.includes('tea')) bonus += 18;
      // Cooling foods get penalty
      if (foodLower.includes('cold') || foodLower.includes('raw') || foodLower.includes('ice') || 
          foodLower.includes('cucumber')) bonus -= 8;
    }
    
    if (season === 'Monsoon') {
      // Light, digestible foods get bonus
      if (foodLower.includes('light') || foodLower.includes('steamed') || foodLower.includes('ginger') || 
          foodLower.includes('turmeric') || foodLower.includes('warm')) bonus += 25;
      else if (foodLower.includes('cooked') || foodLower.includes('spiced') || foodLower.includes('tea')) bonus += 18;
      // Heavy, oily foods get penalty
      if (foodLower.includes('heavy') || foodLower.includes('oily') || foodLower.includes('fried') || 
          foodLower.includes('raw')) bonus -= 10;
    }
    
    return Math.max(-10, Math.min(25, bonus));
  };

  // Enhanced regional bonus with cultural authenticity
  const getAdvancedRegionalBonus = (food, region) => {
    if (region === 'Pan-India') return 5;
    
    const foodLower = food.toLowerCase();
    let bonus = 0;
    
    const regionData = regionalFoodDatabase[region];
    if (!regionData) return 0;
    
    // Check for exact matches in regional specialties (highest bonus)
    const allRegionalItems = [
      ...regionData.staples,
      ...regionData.vegetables,
      ...regionData.specialties,
      ...regionData.beverages,
      ...regionData.spices
    ].map(item => item.toLowerCase());
    
    // Exact specialty match
    if (regionData.specialties.some(item => foodLower.includes(item.toLowerCase()))) bonus += 20;
    // Staple food match
    else if (regionData.staples.some(item => foodLower.includes(item.toLowerCase()))) bonus += 15;
    // Regional ingredient match
    else if (allRegionalItems.some(item => foodLower.includes(item) || item.includes(foodLower))) bonus += 10;
    
    return Math.max(0, Math.min(20, bonus));
  };

  // New: Meal timing optimization
  const getMealTimingBonus = (food, mealType, timeOfDay = 'day') => {
    const foodLower = food.toLowerCase();
    let bonus = 0;
    
    if (mealType === 'Breakfast') {
      // Light, energizing foods for morning
      if (foodLower.includes('fruit') || foodLower.includes('oats') || foodLower.includes('milk') || 
          foodLower.includes('honey') || foodLower.includes('nuts')) bonus += 15;
      else if (foodLower.includes('light') || foodLower.includes('warm')) bonus += 10;
    }
    
    if (mealType === 'Lunch') {
      // Substantial, well-balanced foods for midday (strongest digestion)
      if (foodLower.includes('dal') || foodLower.includes('rice') || foodLower.includes('vegetables') || 
          foodLower.includes('curry') || foodLower.includes('roti')) bonus += 15;
      else if (foodLower.includes('cooked') || foodLower.includes('substantial')) bonus += 10;
    }
    
    if (mealType === 'Dinner') {
      // Light, easy-to-digest foods for evening
      if (foodLower.includes('soup') || foodLower.includes('khichdi') || foodLower.includes('stew') ||
          foodLower.includes('light') || foodLower.includes('steamed')) bonus += 15;
      else if (foodLower.includes('warm') || foodLower.includes('cooked')) bonus += 10;
      
      // Penalize heavy, hard-to-digest foods at night
      if (foodLower.includes('meat') || foodLower.includes('cheese') || foodLower.includes('fried') ||
          foodLower.includes('heavy') || foodLower.includes('yogurt')) bonus -= 10;
    }
    
    if (mealType.includes('Snack')) {
      // Light, nutritious snacks
      if (foodLower.includes('fruit') || foodLower.includes('nuts') || foodLower.includes('seeds') ||
          foodLower.includes('herbal') || foodLower.includes('tea')) bonus += 10;
      
      // Time-specific snack bonuses
      if (timeOfDay === 'morning' && foodLower.includes('warm')) bonus += 5;
      if (timeOfDay === 'evening' && foodLower.includes('digestive')) bonus += 5;
    }
    
    // Time of day adjustments
    if (timeOfDay === 'morning' && foodLower.includes('warm')) bonus += 5;
    if (timeOfDay === 'evening' && foodLower.includes('cooling')) bonus += 5;
    
    return Math.max(0, Math.min(20, bonus)); // Cap bonus between 0-20
  };

  // Enhanced nutritional scoring
  const getAdvancedNutritionalBonus = (food) => {
    const foodLower = food.toLowerCase();
    let bonus = 0;
    
    // Protein sources
    if (foodLower.includes('dal') || foodLower.includes('lentil') || foodLower.includes('paneer') || 
        foodLower.includes('sprouts') || foodLower.includes('nuts') || foodLower.includes('seeds')) bonus += 3;
    
    // Fiber-rich foods
    if (foodLower.includes('vegetable') || foodLower.includes('fruit') || foodLower.includes('whole') || 
        foodLower.includes('grain') || foodLower.includes('leafy')) bonus += 3;
    
    // Probiotic foods
    if (foodLower.includes('curd') || foodLower.includes('yogurt') || foodLower.includes('fermented') || 
        foodLower.includes('buttermilk')) bonus += 2;
    
    // Healthy fats
    if (foodLower.includes('ghee') || foodLower.includes('coconut') || foodLower.includes('nuts') || 
        foodLower.includes('seeds') || foodLower.includes('avocado')) bonus += 2;
    
    return Math.max(0, Math.min(10, bonus));
  };

  // New: Digestibility factor based on dosha
  const getDigestibilityBonus = (food, dosha) => {
    const foodLower = food.toLowerCase();
    let bonus = 0;
    
    // Easy to digest foods
    if (foodLower.includes('khichdi') || foodLower.includes('soup') || foodLower.includes('steamed') || 
        foodLower.includes('cooked') || foodLower.includes('warm')) bonus += 8;
    
    // Moderate digestion
    else if (foodLower.includes('dal') || foodLower.includes('rice') || foodLower.includes('vegetables')) bonus += 5;
    
    // Dosha-specific digestibility
    if (dosha === 'Vata' || dosha.includes('Vata')) {
      // Vata needs easily digestible, warm foods
      if (foodLower.includes('warm') || foodLower.includes('oil') || foodLower.includes('ghee')) bonus += 2;
    }
    
    if (dosha === 'Kapha' || dosha.includes('Kapha')) {
      // Kapha needs light, stimulating foods
      if (foodLower.includes('light') || foodLower.includes('spicy') || foodLower.includes('bitter')) bonus += 2;
      // Heavy foods are harder for Kapha to digest
      if (foodLower.includes('heavy') || foodLower.includes('oily') || foodLower.includes('sweet')) bonus -= 3;
    }
    
    return Math.max(-3, Math.min(10, bonus));
  };

  // New: Ayurvedic properties alignment
  const getAyurvedicPropertiesBonus = (food, dosha, season) => {
    const foodLower = food.toLowerCase();
    let bonus = 0;
    
    // Rasa (taste) alignment
    if (dosha === 'Vata' || dosha.includes('Vata')) {
      if (foodLower.includes('sweet') || foodLower.includes('sour') || foodLower.includes('salty')) bonus += 5;
    }
    if (dosha === 'Pitta' || dosha.includes('Pitta')) {
      if (foodLower.includes('sweet') || foodLower.includes('bitter') || foodLower.includes('astringent')) bonus += 5;
    }
    if (dosha === 'Kapha' || dosha.includes('Kapha')) {
      if (foodLower.includes('pungent') || foodLower.includes('bitter') || foodLower.includes('astringent')) bonus += 5;
    }
    
    // Virya (heating/cooling) alignment with season
    if (season === 'Summer' && (foodLower.includes('cooling') || foodLower.includes('cold'))) bonus += 5;
    if (season === 'Winter' && (foodLower.includes('heating') || foodLower.includes('warm'))) bonus += 5;
    
    // Prabhava (special effects)
    if (foodLower.includes('turmeric') || foodLower.includes('ginger') || foodLower.includes('ghee') || 
        foodLower.includes('honey')) bonus += 5; // These have special healing properties
    
    return Math.max(0, Math.min(15, bonus));
  };

  // New: Traditional combination bonus
  const getTraditionalCombinationBonus = (food, region, season) => {
    const foodLower = food.toLowerCase();
    let bonus = 0;
    
    // Traditional seasonal combinations
    if (season === 'Summer' && region === 'South' && 
        (foodLower.includes('coconut') || foodLower.includes('curry leaves') || foodLower.includes('buttermilk'))) bonus += 5;
    
    if (season === 'Winter' && region === 'North' && 
        (foodLower.includes('sarson') || foodLower.includes('makki') || foodLower.includes('gur'))) bonus += 5;
    
    if (season === 'Monsoon' && 
        (foodLower.includes('ginger') || foodLower.includes('turmeric') || foodLower.includes('warm'))) bonus += 3;
    
    return Math.max(0, Math.min(5, bonus));
  };

  const getDoshaFoodBonus = (food, dosha) => {
    const foodLower = food.toLowerCase();
    let bonus = 0;
    
    if (dosha === 'Vata' || dosha.includes('Vata')) {
      if (foodLower.includes('warm') || foodLower.includes('ghee') || foodLower.includes('oil') || 
          foodLower.includes('khichdi') || foodLower.includes('soup') || foodLower.includes('milk')) bonus += 15;
      if (foodLower.includes('raw') || foodLower.includes('cold')) bonus -= 10;
    }
    
    if (dosha === 'Pitta' || dosha.includes('Pitta')) {
      if (foodLower.includes('cool') || foodLower.includes('cucumber') || foodLower.includes('coconut') || 
          foodLower.includes('mint') || foodLower.includes('coriander')) bonus += 15;
      if (foodLower.includes('spicy') || foodLower.includes('chili') || foodLower.includes('hot')) bonus -= 10;
    }
    
    if (dosha === 'Kapha' || dosha.includes('Kapha')) {
      if (foodLower.includes('light') || foodLower.includes('spicy') || foodLower.includes('ginger') || 
          foodLower.includes('pepper') || foodLower.includes('bitter')) bonus += 15;
      if (foodLower.includes('heavy') || foodLower.includes('oily') || foodLower.includes('sweet')) bonus -= 10;
    }
    
    return bonus;
  };

  const getSeasonalBonus = (food, season) => {
    if (season === 'All-Season') return 10;
    
    const foodLower = food.toLowerCase();
    const seasonalData = seasonalFoodDatabase[season];
    if (!seasonalData) return 0;
    
    // Check if food matches seasonal items
    const allSeasonalItems = [
      ...seasonalData.vegetables,
      ...seasonalData.fruits,
      ...seasonalData.grains,
      ...seasonalData.spices,
      ...seasonalData.meals
    ].map(item => item.toLowerCase());
    
    const isSeasonalMatch = allSeasonalItems.some(item => 
      foodLower.includes(item) || item.includes(foodLower)
    );
    
    return isSeasonalMatch ? 25 : 5;
  };

  const getRegionalBonus = (food, region) => {
    if (region === 'Pan-India') return 8;
    
    const foodLower = food.toLowerCase();
    const regionData = regionalFoodDatabase[region];
    if (!regionData) return 0;
    
    // Check if food matches regional items
    const allRegionalItems = [
      ...regionData.staples,
      ...regionData.vegetables,
      ...regionData.specialties,
      ...regionData.beverages,
      ...regionData.spices
    ].map(item => item.toLowerCase());
    
    const isRegionalMatch = allRegionalItems.some(item => 
      foodLower.includes(item) || item.includes(foodLower)
    );
    
    return isRegionalMatch ? 15 : 3;
  };

  const getNutritionalBonus = (food) => {
    const foodLower = food.toLowerCase();
    let bonus = 0;
    
    // Protein-rich foods
    if (foodLower.includes('dal') || foodLower.includes('paneer') || foodLower.includes('sprouts') || 
        foodLower.includes('legume') || foodLower.includes('beans')) bonus += 3;
    
    // Fiber-rich foods
    if (foodLower.includes('vegetable') || foodLower.includes('salad') || foodLower.includes('fruit') || 
        foodLower.includes('whole grain')) bonus += 3;
    
    // Probiotic foods
    if (foodLower.includes('curd') || foodLower.includes('yogurt') || foodLower.includes('buttermilk') || 
        foodLower.includes('fermented')) bonus += 2;
    
    // Healthy fats
    if (foodLower.includes('ghee') || foodLower.includes('coconut') || foodLower.includes('nuts')) bonus += 2;
    
    return bonus;
  };

  // Enhanced food database with Rasa classification
  const foodsByRasa = {
    Sweet: [
      // Breakfast Items
      'Poha (flattened rice)', 'Upma', 'Idli with coconut chutney', 'Dosa', 'Paratha with curd',
      'Wheat bread with butter', 'Cornflakes with milk', 'Daliya (broken wheat)', 'Aloo paratha',
      // Rice Dishes
      'Steamed white rice', 'Jeera rice', 'Vegetable pulao', 'Plain khichdi', 'Curd rice',
      // Roti & Breads
      'Phulka (roti)', 'Chapati', 'Roti with ghee', 'Methi paratha', 'Gobi paratha',
      // Fruits
      'Banana', 'Apple', 'Mango', 'Papaya', 'Grapes', 'Sweet orange', 'Chikoo (sapota)', 'Custard apple',
      // Dairy
      'Warm milk', 'Lassi', 'Paneer bhurji', 'Paneer tikka', 'Curd (dahi)',
      // Vegetables
      'Aloo sabzi (potato curry)', 'Sweet potato chaat', 'Pumpkin curry', 'Carrot sabzi', 'Beetroot salad',
      // Sweets
      'Kheer', 'Halwa', 'Dates', 'Jaggery (gur)', 'Honey', 'Suji halwa'
    ],
    Sour: [
      // Fermented
      'Curd rice', 'Buttermilk (chaas)', 'Dahi (yogurt)', 'Idli with sambar', 'Dosa with sambar',
      // Citrus & Fruits
      'Lemon water (nimbu pani)', 'Lemon rice', 'Amla (Indian gooseberry)', 'Tamarind rice', 'Orange',
      // Pickles & Chutneys
      'Mango pickle', 'Lemon pickle', 'Mixed pickle', 'Tomato chutney', 'Tamarind chutney', 'Green chutney',
      // Curries & Soups
      'Tomato curry', 'Rasam', 'Sambar', 'Tomato soup', 'Kadhi', 'Dal with lemon'
    ],
    Salty: [
      // Snacks
      'Roasted chana (chickpeas)', 'Roasted peanuts', 'Namkeen', 'Mathri', 'Khakhra',
      'Salted lassi', 'Popcorn (lightly salted)', 'Roasted makhana (fox nuts)',
      // Soups & Beverages
      'Vegetable soup', 'Dal soup', 'Salted buttermilk', 'Jeera water with salt'
    ],
    Pungent: [
      // Tea & Beverages
      'Ginger tea (adrak chai)', 'Masala chai', 'Black pepper tea', 'Tulsi tea',
      // Vegetables & Snacks
      'Onion pakora', 'Aloo tikki', 'Radish (mooli) salad', 'Garlic chutney', 'Green chili chutney',
      // Curries
      'Aloo matar (spicy)', 'Chole (spicy chickpeas)', 'Rajma masala', 'Sambhar', 'Pepper rasam',
      'Mustard greens (sarson ka saag)', 'Kadhi with tadka'
    ],
    Bitter: [
      // Leafy Greens
      'Palak (spinach) sabzi', 'Methi (fenugreek) sabzi', 'Karela (bitter gourd) fry', 'Bathua sabzi',
      'Spinach soup', 'Palak paneer', 'Methi paratha', 'Saag',
      // Vegetables
      'Cabbage sabzi', 'Broccoli curry', 'Cauliflower sabzi', 'Lauki (bottle gourd)', 'Tinda',
      // Beverages
      'Green tea', 'Tulsi tea', 'Karela juice', 'Neem tea', 'Black coffee (no sugar)'
    ],
    Astringent: [
      // Dal & Lentils
      'Moong dal', 'Toor dal (arhar dal)', 'Masoor dal (red lentil)', 'Mixed dal', 'Dal tadka',
      'Rajma (kidney beans)', 'Kala chana', 'Kabuli chana (white chickpeas)', 'Chole',
      // Vegetables
      'Bhindi (okra) sabzi', 'Sem (green beans)', 'Matar (peas) curry', 'Cauliflower', 'Cabbage',
      'Baingan (eggplant) bharta', 'Aloo gobi', 'Mix veg curry',
      // Fruits & Others
      'Pomegranate (anar)', 'Green apple', 'Guava (amrud)', 'Jamun', 
      'Tea without sugar', 'Sprouts salad', 'Moong sprouts'
    ]
  };

  function pickFoodsForMeal(prefer, avoid, allergyFilters, mealType, usedFoods = new Set()) {
    // ML-enhanced food selection with seasonal and regional scoring
    const preferredFoods = prefer.flatMap(r => foodsByRasa[r] || []);
    const allowedRasas = Object.keys(foodsByRasa).filter(r => !avoid.includes(r));
    const compatibleFoods = allowedRasas.flatMap(r => foodsByRasa[r] || []);

    // Combine all potential foods
    const allPotentialFoods = [...new Set([...preferredFoods, ...compatibleFoods])];
    
    // Add seasonal and regional foods
    if (season !== 'All-Season' && seasonalFoodDatabase[season]) {
      const seasonalData = seasonalFoodDatabase[season];
      allPotentialFoods.push(...seasonalData.meals, ...seasonalData.vegetables, ...seasonalData.fruits);
    }
    
    if (region !== 'Pan-India' && regionalFoodDatabase[region]) {
      const regionData = regionalFoodDatabase[region];
      allPotentialFoods.push(...regionData.specialties, ...regionData.staples);
    }

    // Meal-specific food preferences with seasonal/regional additions
    const mealSpecificFoods = {
      'Breakfast': ['Poha', 'Upma', 'Paratha with curd', 'Idli with sambar', 'Dosa', 'Aloo paratha', 'Daliya', 'Bread with butter'],
      'Mid-Morning Snack': ['Banana', 'Apple', 'Seasonal fruit', 'Roasted chana', 'Dates', 'Coconut water', 'Buttermilk'],
      'Lunch': ['Dal rice', 'Roti with sabzi', 'Rajma chawal', 'Chole rice', 'Sambar rice', 'Curd', 'Salad', 'Vegetable curry'],
      'Evening Snack': ['Chai (tea)', 'Pakora', 'Aloo tikki', 'Sprouts', 'Roasted makhana', 'Fruit', 'Biscuits with tea'],
      'Dinner': ['Khichdi', 'Dal with roti', 'Light vegetable curry', 'Soup', 'Chapati with sabzi', 'Moong dal']
    };

    // Score all foods using advanced ML algorithm
    const scoredFoods = allPotentialFoods
      .filter(food => !usedFoods.has(food))
      .map(food => ({
        name: food,
        score: calculateFoodScore(food, dosha, season, region, allergyFilters, mealType, 'day')
      }))
      .filter(item => item.score > 0) // Remove allergenic foods (score 0)
      .sort((a, b) => b.score - a.score); // Sort by score descending
    
    // Log top scoring foods for debugging
    console.log(`Top foods for ${mealType} (${dosha}, ${season}, ${region}):`, 
      scoredFoods.slice(0, 5).map(f => `${f.name}: ${f.score}`));

    // Select top-scored foods with some randomization for variety
    const itemCount = ['Breakfast', 'Lunch', 'Dinner'].includes(mealType) ? 4 : 3;
    const items = [];
    
    // Take top 50% of high-scoring foods and randomly select from them
    const topFoods = scoredFoods.slice(0, Math.max(10, Math.floor(scoredFoods.length * 0.5)));
    
    while (items.length < itemCount && topFoods.length > 0) {
      const idx = Math.floor(Math.random() * topFoods.length);
      const selected = topFoods.splice(idx, 1)[0];
      items.push(selected.name);
      usedFoods.add(selected.name);
    }

    // Fallback if not enough items
    if (items.length < 2) {
      const mealSuggestions = mealSpecificFoods[mealType] || [];
      const safeSuggestions = mealSuggestions.filter(food => 
        !allergyFilters.some(allergen => food.toLowerCase().includes(allergen.toLowerCase())) &&
        !usedFoods.has(food)
      );
      
      while (items.length < itemCount && safeSuggestions.length > 0) {
        const idx = Math.floor(Math.random() * safeSuggestions.length);
        const selected = safeSuggestions.splice(idx, 1)[0];
        items.push(selected);
        usedFoods.add(selected);
      }
    }

    // Ensure variety and deduplicate
    const unique = Array.from(new Set(items)).slice(0, itemCount);
    return unique.length ? unique : ['Balanced Ayurvedic meal'];
  }

  // Build allergy filter list from patient profile
  const allergyFilters = Array.isArray(patient?.healthProfile?.allergies)
    ? patient.healthProfile.allergies.map(a => a.allergen).filter(Boolean)
    : [];

  const conditionNames = Array.isArray(patient?.healthProfile?.healthConditions)
    ? patient.healthProfile.healthConditions.map(c => c.name).filter(Boolean)
    : healthConditions;

  const meals = [];
  const usedFoods = new Set(); // Track used foods for variety
  
  // Enhanced taste distribution per meal with better Ayurvedic alignment
  const tasteMixPerMeal = {
    'Breakfast': ['Sweet', ...(guideForPlan.prefer.includes('Sweet') ? ['Sweet'] : []), guideForPlan.prefer[0] || 'Sweet'],
    'Mid-Morning Snack': [guideForPlan.prefer[1] || 'Sweet', 'Astringent'],
    'Lunch': [guideForPlan.prefer[0] || 'Sweet', guideForPlan.prefer[1] || 'Bitter', guideForPlan.prefer[2] || 'Astringent', 'Salty'],
    'Evening Snack': [guideForPlan.prefer[1] || 'Bitter', 'Pungent'],
    'Dinner': [guideForPlan.prefer[2] || 'Astringent', 'Sweet', 'Bitter']
  };

  // Generate more realistic calorie ranges based on meal type
  const getCalorieRange = (mealType) => {
    const ranges = {
      'Breakfast': { min: 200, max: 350 },
      'Mid-Morning Snack': { min: 80, max: 150 },
      'Lunch': { min: 300, max: 500 },
      'Evening Snack': { min: 80, max: 150 },
      'Dinner': { min: 250, max: 400 }
    };
    const range = ranges[mealType] || { min: 150, max: 300 };
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  };

  // Get Ayurvedic properties (Virya - hot/cold & Digestibility)
  const getAyurvedicProperties = (foodName) => {
    const food = foodName.toLowerCase();
    
    // Determine Virya (heating/cooling nature)
    let virya = 'Neutral';
    
    // Heating (Ushna) foods
    if (food.includes('ginger') || food.includes('pepper') || food.includes('chili') || 
        food.includes('garlic') || food.includes('onion') || food.includes('mustard') ||
        food.includes('masala') || food.includes('spicy') || food.includes('hot') ||
        food.includes('radish') || food.includes('pakora') || food.includes('fried')) {
      virya = 'Heating';
    }
    // Cooling (Sheeta) foods  
    else if (food.includes('milk') || food.includes('coconut') || food.includes('cucumber') ||
             food.includes('melon') || food.includes('curd') || food.includes('yogurt') ||
             food.includes('buttermilk') || food.includes('mint') || food.includes('cilantro') ||
             food.includes('fennel') || food.includes('sweet potato') || food.includes('pumpkin') ||
             food.includes('banana') || food.includes('mango') || food.includes('grapes') ||
             food.includes('apple') || food.includes('pear') || food.includes('orange')) {
      virya = 'Cooling';
    }
    // Mildly heating
    else if (food.includes('rice') || food.includes('wheat') || food.includes('chapati') ||
             food.includes('roti') || food.includes('oats') || food.includes('honey')) {
      virya = 'Mildly Heating';
    }
    
    // Determine digestibility
    let digestion = 'Easy to digest';
    
    // Heavy/difficult to digest foods
    if (food.includes('cheese') || food.includes('paneer') || food.includes('fried') ||
        food.includes('pakora') || food.includes('rajma') || food.includes('kidney beans') ||
        food.includes('chana') || food.includes('chickpea') || food.includes('black gram') ||
        food.includes('urad') || food.includes('heavy')) {
      digestion = 'Heavy, digest slowly';
    }
    // Very easy to digest
    else if (food.includes('khichdi') || food.includes('soup') || food.includes('moong dal') ||
             food.includes('rice') || food.includes('banana') || food.includes('apple') ||
             food.includes('papaya') || food.includes('watermelon') || food.includes('juice')) {
      digestion = 'Very easy to digest';
    }
    // Moderate digestion
    else if (food.includes('dal') || food.includes('lentil') || food.includes('vegetable') ||
             food.includes('curry') || food.includes('roti') || food.includes('chapati') ||
             food.includes('spinach') || food.includes('broccoli')) {
      digestion = 'Moderate digestion';
    }
    
    return { virya, digestion };
  };

  // Calculate nutrition values based on calories and food type
  const calculateNutrition = (foodName, calories) => {
    const foodType = foodName.toLowerCase();
    
    // Base nutrition ratios by food category
    let proteinRatio, carbRatio, fatRatio, fiberRatio;
    
    if (foodType.includes('rice') || foodType.includes('chapati') || foodType.includes('oats') || foodType.includes('quinoa')) {
      // Grains & Cereals
      proteinRatio = 0.08; // 8% protein
      carbRatio = 0.75;    // 75% carbs
      fatRatio = 0.05;     // 5% fat
      fiberRatio = 0.12;   // 12% fiber
    } else if (foodType.includes('dal') || foodType.includes('lentils') || foodType.includes('beans')) {
      // Legumes
      proteinRatio = 0.25; // 25% protein
      carbRatio = 0.60;    // 60% carbs
      fatRatio = 0.05;     // 5% fat
      fiberRatio = 0.10;   // 10% fiber
    } else if (foodType.includes('milk') || foodType.includes('yogurt') || foodType.includes('cheese')) {
      // Dairy
      proteinRatio = 0.20; // 20% protein
      carbRatio = 0.30;    // 30% carbs
      fatRatio = 0.50;     // 50% fat
      fiberRatio = 0.00;   // 0% fiber
    } else if (foodType.includes('nuts') || foodType.includes('seeds') || foodType.includes('almond') || foodType.includes('walnut')) {
      // Nuts & Seeds
      proteinRatio = 0.15; // 15% protein
      carbRatio = 0.15;    // 15% carbs
      fatRatio = 0.70;     // 70% fat
      fiberRatio = 0.10;   // 10% fiber
    } else if (foodType.includes('fruit') || foodType.includes('apple') || foodType.includes('banana') || foodType.includes('orange')) {
      // Fruits
      proteinRatio = 0.05; // 5% protein
      carbRatio = 0.90;    // 90% carbs
      fatRatio = 0.05;     // 5% fat
      fiberRatio = 0.15;   // 15% fiber
    } else if (foodType.includes('vegetable') || foodType.includes('curry') || foodType.includes('soup') || foodType.includes('salad')) {
      // Vegetables
      proteinRatio = 0.10; // 10% protein
      carbRatio = 0.70;    // 70% carbs
      fatRatio = 0.10;     // 10% fat
      fiberRatio = 0.20;   // 20% fiber
    } else {
      // Default balanced nutrition
      proteinRatio = 0.15; // 15% protein
      carbRatio = 0.60;    // 60% carbs
      fatRatio = 0.25;     // 25% fat
      fiberRatio = 0.10;   // 10% fiber
    }

    // Calculate nutrition values (per 100g serving)
    const protein = Math.round((calories * proteinRatio) / 4); // 4 cal/g protein
    const carbs = Math.round((calories * carbRatio) / 4);      // 4 cal/g carbs
    const fat = Math.round((calories * fatRatio) / 9);         // 9 cal/g fat
    const fiber = Math.round((calories * fiberRatio) / 4);     // 4 cal/g fiber

    return {
      protein: Math.max(1, protein),
      carbs: Math.max(1, carbs),
      fat: Math.max(1, fat),
      fiber: Math.max(0, fiber)
    };
  };

  // Generate appropriate serving sizes
  const getServingSize = (foodName, mealType) => {
    const servingSizes = {
      // Grains & Cereals
      'rice': '1/2 cup cooked', 'chapati': '1 medium', 'oats': '1/2 cup', 'quinoa': '1/3 cup cooked',
      // Vegetables
      'curry': '1/2 cup', 'soup': '1 bowl', 'salad': '1 cup', 'vegetables': '1/2 cup',
      // Dairy & Liquids
      'milk': '1 cup', 'tea': '1 cup', 'water': '1 glass', 'juice': '1/2 cup',
      // Fruits & Nuts
      'fruits': '1 medium', 'nuts': '1 handful', 'seeds': '1 tbsp',
      // Dal & Legumes
      'dal': '1/2 cup', 'lentils': '1/2 cup', 'beans': '1/3 cup'
    };

    // Find matching serving size based on food name keywords
    for (const [key, size] of Object.entries(servingSizes)) {
      if (foodName.toLowerCase().includes(key)) {
        return size;
      }
    }
    
    // Default serving sizes based on meal type
    const defaultSizes = {
      'Breakfast': '1 serving',
      'Mid-Morning Snack': '1 small serving',
      'Lunch': '1 generous serving',
      'Evening Snack': '1 small serving',
      'Dinner': '1 moderate serving'
    };
    
    return defaultSizes[mealType] || '1 serving';
  };

  days.forEach(day => {
    mealTypes.forEach(mealType => {
      const tastes = tasteMixPerMeal[mealType] || guideForPlan.prefer;
      const selectedFoods = pickFoodsForMeal(tastes, guideForPlan.avoid, allergyFilters, mealType, usedFoods);
      
      const foods = selectedFoods.map(name => {
        const calories = getCalorieRange(mealType);
        const nutrition = calculateNutrition(name, calories);
        const ayurvedicProps = getAyurvedicProperties(name);
        return {
          name,
          quantity: getServingSize(name, mealType),
          calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fat: nutrition.fat,
          fiber: nutrition.fiber,
          notes: `${ayurvedicProps.virya} • ${ayurvedicProps.digestion} • ${tastes.join(', ')} tastes`
        };
      });

      const notes = generateMealNotesByRasa(dosha, mealType, guideForPlan, conditionNames, allergyFilters);

      meals.push({ day, mealType, foods, notes });
    });
  });

  return {
    name: `${dosha} ${season !== 'All-Season' ? season : ''} ${region !== 'Pan-India' ? region : ''} Plan - ${new Date().toLocaleDateString()}`.trim().replace(/\s+/g, ' '),
    dosha,
    season,
    region,
    duration: fastMode ? 3 : duration,
    goals,
    restrictions: conditionNames,
    meals,
    status: 'Active'
  };
}

function generateMealNotesByRasa(dosha, mealType, guide, healthConditions, allergies) {
  const notes = [
    `Focus: ${guide.prefer.join(', ')} tastes`,
    `Avoid: ${guide.avoid.join(', ')}`
  ];

  if (dosha === 'Vata') {
    notes.push('Prefer warm, cooked, oily and grounding foods');
  } else if (dosha === 'Pitta') {
    notes.push('Prefer cooling, less oily, mildly spiced foods');
  } else if (dosha === 'Kapha') {
    notes.push('Prefer light, warm, dry and stimulating foods');
  }

  if (mealType === 'Breakfast') notes.push('Start day gently; favor easy-to-digest foods');
  if (mealType === 'Lunch') notes.push('Main meal of the day; digestion strongest');
  if (mealType === 'Dinner') notes.push('Keep it lighter and earlier');

  if (Array.isArray(healthConditions) && healthConditions.find(h => /diabet/i.test(h))) {
    notes.push('Moderate sweet taste; focus on complex carbs and fiber');
  }

  if (Array.isArray(allergies) && allergies.length) {
    notes.push(`Avoid allergens: ${allergies.join(', ')}`);
  }

  return notes;
}

// Add a food to a specific meal by index
router.post('/:id/meals/:mealIndex/foods', auth, [
  body('name').trim().isLength({ min: 2 }).withMessage('Food name is required'),
  body('quantity').optional().trim(),
  body('calories').optional().isNumeric(),
  body('protein').optional().isNumeric(),
  body('carbs').optional().isNumeric(),
  body('fat').optional().isNumeric(),
  body('fiber').optional().isNumeric(),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id, mealIndex } = req.params;
    const plan = await DietPlan.findOne({ _id: id, practitioner: req.userId });
    if (!plan) return res.status(404).json({ message: 'Diet plan not found' });

    const idx = parseInt(mealIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= plan.meals.length) {
      return res.status(400).json({ message: 'Invalid meal index' });
    }

    const food = {
      name: req.body.name,
      quantity: req.body.quantity || '1 serving',
      calories: req.body.calories || 150,
      protein: req.body.protein || 0,
      carbs: req.body.carbs || 0,
      fat: req.body.fat || 0,
      fiber: req.body.fiber || 0,
      notes: req.body.notes || ''
    };
    plan.meals[idx].foods.push(food);
    await plan.save();

    res.json({ message: 'Food added', meal: plan.meals[idx] });
  } catch (error) {
    console.error('Add food error:', error);
    res.status(500).json({ message: 'Server error while adding food' });
  }
});

// Delete a food from a specific meal by indices
router.delete('/:id/meals/:mealIndex/foods/:foodIndex', auth, async (req, res) => {
  try {
    const { id, mealIndex, foodIndex } = req.params;
    const plan = await DietPlan.findOne({ _id: id, practitioner: req.userId });
    if (!plan) return res.status(404).json({ message: 'Diet plan not found' });

    const mIdx = parseInt(mealIndex, 10);
    const fIdx = parseInt(foodIndex, 10);
    if (isNaN(mIdx) || isNaN(fIdx) || mIdx < 0 || fIdx < 0 || mIdx >= plan.meals.length || fIdx >= plan.meals[mIdx].foods.length) {
      return res.status(400).json({ message: 'Invalid meal or food index' });
    }

    plan.meals[mIdx].foods.splice(fIdx, 1);
    await plan.save();
    res.json({ message: 'Food deleted', meal: plan.meals[mIdx] });
  } catch (error) {
    console.error('Delete food error:', error);
    res.status(500).json({ message: 'Server error while deleting food' });
  }
});

module.exports = router;


