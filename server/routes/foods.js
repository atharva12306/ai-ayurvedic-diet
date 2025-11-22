const express = require('express');
const { body, validationResult } = require('express-validator');
const Food = require('../models/Food');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/foods
// @desc    Get all foods with filtering and search
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      category, 
      taste, 
      dosha, 
      digestibility, 
      temperature,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const query = { isActive: true };

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by taste
    if (taste) {
      query.taste = taste;
    }

    // Filter by dosha compatibility
    if (dosha) {
      const doshaKey = `ayurvedicProperties.doshaCompatibility.${dosha.toLowerCase()}`;
      query[doshaKey] = { $in: ['Excellent', 'Good'] };
    }

    // Filter by digestibility
    if (digestibility) {
      query['ayurvedicProperties.digestibility'] = digestibility;
    }

    // Filter by temperature
    if (temperature) {
      query['ayurvedicProperties.temperature'] = temperature;
    }

    // Sort options
    const sortOptions = {};
    if (sortBy === 'name') {
      sortOptions.name = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'calories') {
      sortOptions['nutritionalInfo.calories'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'protein') {
      sortOptions['nutritionalInfo.protein'] = sortOrder === 'desc' ? -1 : 1;
    }

    const foods = await Food.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Food.countDocuments(query);

    res.json({
      foods,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get foods error:', error);
    res.status(500).json({ message: 'Server error while fetching foods' });
  }
});

// @route   GET /api/foods/:id
// @desc    Get single food by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food || !food.isActive) {
      return res.status(404).json({ message: 'Food not found' });
    }

    res.json(food);
  } catch (error) {
    console.error('Get food error:', error);
    res.status(500).json({ message: 'Server error while fetching food' });
  }
});

// @route   GET /api/foods/categories/list
// @desc    Get list of all categories
// @access  Public
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Food.distinct('category', { isActive: true });
    res.json(categories.sort());
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error while fetching categories' });
  }
});

// @route   GET /api/foods/tastes/list
// @desc    Get list of all tastes
// @access  Public
router.get('/tastes/list', async (req, res) => {
  try {
    const tastes = await Food.distinct('taste', { isActive: true });
    res.json(tastes.sort());
  } catch (error) {
    console.error('Get tastes error:', error);
    res.status(500).json({ message: 'Server error while fetching tastes' });
  }
});

// @route   GET /api/foods/dosha/:dosha
// @desc    Get foods compatible with specific dosha
// @access  Public
router.get('/dosha/:dosha', async (req, res) => {
  try {
    const { dosha } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!['vata', 'pitta', 'kapha'].includes(dosha.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid dosha type' });
    }

    const doshaKey = `ayurvedicProperties.doshaCompatibility.${dosha.toLowerCase()}`;
    const query = {
      isActive: true,
      [doshaKey]: { $in: ['Excellent', 'Good'] }
    };

    const foods = await Food.find(query)
      .sort({ [doshaKey]: -1, name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Food.countDocuments(query);

    res.json({
      foods,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      dosha
    });
  } catch (error) {
    console.error('Get dosha foods error:', error);
    res.status(500).json({ message: 'Server error while fetching dosha foods' });
  }
});

// @route   POST /api/foods
// @desc    Create a new food (Admin only)
// @access  Private
router.post('/', auth, [
  body('name').trim().isLength({ min: 2 }).withMessage('Name is required'),
  body('category').isIn(['Grains', 'Legumes', 'Vegetables', 'Fruits', 'Dairy', 'Spices', 'Nuts', 'Seeds', 'Oils', 'Beverages', 'Herbs'])
    .withMessage('Valid category is required'),
  body('taste').isIn(['Sweet', 'Sour', 'Salty', 'Pungent', 'Bitter', 'Astringent'])
    .withMessage('Valid taste is required'),
  body('nutritionalInfo.calories').isNumeric().withMessage('Calories is required'),
  body('nutritionalInfo.protein').isNumeric().withMessage('Protein is required'),
  body('nutritionalInfo.carbohydrates').isNumeric().withMessage('Carbohydrates is required'),
  body('nutritionalInfo.fat').isNumeric().withMessage('Fat is required'),
  body('ayurvedicProperties.digestibility').isIn(['Light', 'Medium', 'Heavy'])
    .withMessage('Valid digestibility is required'),
  body('ayurvedicProperties.temperature').isIn(['Hot', 'Warm', 'Neutral', 'Cool', 'Cold', 'Cooling'])
    .withMessage('Valid temperature is required'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description is required')
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const food = new Food(req.body);
    await food.save();

    res.status(201).json({
      message: 'Food created successfully',
      food
    });
  } catch (error) {
    console.error('Create food error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Food with this name already exists' });
    } else {
      res.status(500).json({ message: 'Server error while creating food' });
    }
  }
});

// @route   PUT /api/foods/:id
// @desc    Update a food (Admin only)
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const food = await Food.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }

    res.json({
      message: 'Food updated successfully',
      food
    });
  } catch (error) {
    console.error('Update food error:', error);
    res.status(500).json({ message: 'Server error while updating food' });
  }
});

// @route   DELETE /api/foods/:id
// @desc    Delete a food (Admin only)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const food = await Food.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }

    res.json({ message: 'Food deleted successfully' });
  } catch (error) {
    console.error('Delete food error:', error);
    res.status(500).json({ message: 'Server error while deleting food' });
  }
});

// @route   GET /api/foods/search/suggestions
// @desc    Get search suggestions
// @access  Public
router.get('/search/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const suggestions = await Food.find(
      { 
        name: { $regex: q, $options: 'i' },
        isActive: true
      },
      { name: 1, category: 1, taste: 1 }
    )
    .limit(10)
    .sort({ name: 1 });

    res.json(suggestions);
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ message: 'Server error while fetching suggestions' });
  }
});

module.exports = router;






