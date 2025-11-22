import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  Calendar,
  Download,
  RefreshCw,
  Clock,
  Utensils,
  Leaf,
  Zap,
  CheckCircle,
  AlertCircle,
  Info,
  Printer,
  FileDown,
  Plus,
  User
} from 'lucide-react';
import { useFood } from '../contexts/FoodContext';
import { usePatients } from '../contexts/PatientContext';
import axios from 'axios';

const DietGenerator = () => {
  const { getFoodsByDosha, getFoodById } = useFood();
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedPatient, addPatient } = usePatients();
  
  // Get parameters from URL
  const searchParams = new URLSearchParams(location.search);
  const urlDosha = searchParams.get('dosha');
  const urlSeason = searchParams.get('season') || 'All-Season';
  const urlRegion = searchParams.get('region') || 'Pan-India';
  const urlCalories = parseInt(searchParams.get('calories') || '0', 10);
  const fromChatbot = searchParams.get('fromChatbot') === 'true';
  const autoGenerate = searchParams.get('autoGenerate') === 'true';
  const urlPatientName = searchParams.get('name') || '';
  const urlPatientEmail = searchParams.get('email') || '';
  
  const [selectedDosha, setSelectedDosha] = useState(urlDosha || '');
  const [healthConditions, setHealthConditions] = useState('');
  const [dietPlan, setDietPlan] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [savedPlanId, setSavedPlanId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [autoSaved, setAutoSaved] = useState(false);
  
  const [isChatbotFlow, setIsChatbotFlow] = useState(fromChatbot);
  const [isLoading, setIsLoading] = useState(!!urlDosha);
  
  // Auto-save patient data and generate diet plan when coming from chatbot
  useEffect(() => {
    const initializeChatbotFlow = async () => {
      if (fromChatbot && urlPatientName && urlPatientEmail && selectedDosha) {
        try {
          // Save patient data if not already saved
          if (!autoSaved) {
            const newPatient = {
              name: urlPatientName,
              email: urlPatientEmail,
              healthProfile: {
                prakriti: selectedDosha,
                conditions: [],
                allergies: [],
                dietaryPreferences: []
              }
            };
            
            // Add patient to context
            await addPatient(newPatient);
            setAutoSaved(true);
          }
          
          // Auto-generate diet plan immediately when all parameters are available
          if (!dietPlan && !isGenerating && urlSeason && urlRegion) {
            console.log('Auto-generating diet plan with:', {
              dosha: selectedDosha,
              season: urlSeason,
              region: urlRegion
            });
            
            // Trigger automatic generation
            setTimeout(() => {
              generateDietPlan(selectedDosha);
            }, 500);
          }
        } catch (error) {
          console.error('Error in chatbot flow initialization:', error);
        }
      }
    };
    
    initializeChatbotFlow();
  }, [fromChatbot, urlPatientName, urlPatientEmail, selectedDosha, urlSeason, urlRegion, autoSaved, dietPlan, isGenerating, addPatient]);
  
  // Recipe Builder state (only show in full version)
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [recipeItems, setRecipeItems] = useState([]); // {food, qty}
  const [recipeSearch, setRecipeSearch] = useState('');
  const [recipeDay, setRecipeDay] = useState('Monday');
  const [recipeMeal, setRecipeMeal] = useState('Lunch');

  const doshaTypes = [
    { value: 'Vata', label: 'Vata', description: 'Air & Space - Creative, energetic, quick-thinking' },
    { value: 'Pitta', label: 'Pitta', description: 'Fire & Water - Intelligent, focused, determined' },
    { value: 'Kapha', label: 'Kapha', description: 'Earth & Water - Calm, loving, stable' },
    { value: 'Vata-Pitta', label: 'Vata-Pitta', description: 'Combination of Air/Space and Fire/Water' },
    { value: 'Pitta-Kapha', label: 'Pitta-Kapha', description: 'Combination of Fire/Water and Earth/Water' },
    { value: 'Vata-Kapha', label: 'Vata-Kapha', description: 'Combination of Air/Space and Earth/Water' }
  ];

  const mealTypes = [
    { name: 'Breakfast', time: '7:00 AM', icon: '🌅' },
    { name: 'Mid-Morning Snack', time: '10:00 AM', icon: '🍎' },
    { name: 'Lunch', time: '1:00 PM', icon: '🍽️' },
    { name: 'Evening Snack', time: '4:00 PM', icon: '☕' },
    { name: 'Dinner', time: '7:00 PM', icon: '🌙' }
  ];

  const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Save to Patient History state
  const [patientName, setPatientName] = useState(urlPatientName || '');
  const [patientEmail, setPatientEmail] = useState(urlPatientEmail || '');
  const [saveLoading, setSaveLoading] = useState(false);
  const [savedPatientId, setSavedPatientId] = useState(null);
  const [autoSubmitted, setAutoSubmitted] = useState(!!(urlPatientName && urlPatientEmail));

  // Filters & Targets
  const [vegType, setVegType] = useState('any'); // any, veg, vegan, jain
  const [allergies, setAllergies] = useState({ nuts: false, dairy: false, gluten: false });
  const [season, setSeason] = useState(urlSeason); // All-Season, Summer, Winter, Monsoon, Spring, Autumn
  const [region, setRegion] = useState(urlRegion); // Pan-India, North, South, East, West
  const [rotationWindow, setRotationWindow] = useState(3); // days to avoid repeats
  const [targets, setTargets] = useState({ calories: urlCalories > 0 ? urlCalories : 1800, protein: 80, carbs: 220, fat: 60 });
  const mealCalorieShare = {
    'Breakfast': 0.2,
    'Mid-Morning Snack': 0.1,
    'Lunch': 0.35,
    'Evening Snack': 0.1,
    'Dinner': 0.25
  };

  // Auto-generate only if explicitly requested via flag
  useEffect(() => {
    const run = async () => {
      try {
        if (autoGenerate && selectedDosha && !dietPlan && !isGenerating) {
          // Reuse the same flow that ensures patientId and uses current season/region
          await generateDietPlan(selectedDosha);
        }
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [autoGenerate, selectedDosha, dietPlan, isGenerating]);

  const buildServerPlan = (planObj, dosha, options = {}) => {
    const { duration = 7, goals = ['Balance doshas'], restrictions = [] } = options;
    const meals = [];
    Object.entries(planObj).forEach(([day, mealsByType]) => {
      Object.entries(mealsByType).forEach(([mealType, data]) => {
        const foods = (data.foods || []).map(f => ({
          name: f.name,
          quantity: f.quantity || '1 serving',
          calories: Math.round(f.calories || 150),
          protein: f.protein,
          carbs: f.carbs,
          fat: f.fat,
          notes: (f.ingredients && Array.isArray(f.ingredients)) ? f.ingredients.map(i => `${i.name}${i.qty ? ` - ${i.qty}` : ''}`).join('; ') : ''
        }));
        const notes = Array.isArray(data.notes) ? data.notes : [];
        meals.push({ day, mealType, foods, notes });
      });
    });
    return {
      name: `${dosha} Plan - ${new Date().toLocaleDateString()}`,
      dosha,
      duration,
      goals,
      restrictions,
      meals,
      status: 'Active'
    };
  };

  const savePlanToServer = async (patientId, planObj, dosha) => {
    try {
      setIsSavingPlan(true);
      const payload = buildServerPlan(planObj, dosha, { duration: 7, goals: ['Balance doshas'], restrictions: [] });
      
      console.log('Saving diet plan with payload:', {
        patient: patientId,
        name: payload.name,
        dosha: payload.dosha,
        season: season,
        region: region,
        mealsCount: payload.meals?.length
      });
      
      const { data } = await axios.post('/api/diet-plans', {
        patient: patientId,
        season: season,
        region: region,
        ...payload
      });
      
      console.log('Diet plan saved successfully:', data);
      setSavedPlanId(data?.dietPlan?._id || null);
      return data?.dietPlan?._id || null;
    } catch (e) {
      console.error('Save plan error:', e);
      return null;
    } finally {
      setIsSavingPlan(false);
    }
  };

  // Minimal recipe catalog for demo generation
  const recipeCatalog = [
    {
      name: 'Poha',
      mealTypes: ['Breakfast'],
      compatibleDoshas: ['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha'],
      calories: 280,
      protein: 8,
      carbs: 45,
      fat: 7,
      image: 'https://images.unsplash.com/photo-1657630610862-cfae91b65b50?w=300&h=200&fit=crop',
      rasa: ['Sweet', 'Sour'],
      temperature: 'Warm',
      digestibility: 'Light',
      vegType: 'veg',
      allergens: ['nuts'],
      seasons: ['any'],
      ingredients: [
        { name: 'Flattened Rice (Poha)', qty: '60 g' },
        { name: 'Peanuts', qty: '15 g' },
        { name: 'Onion', qty: '30 g' },
        { name: 'Turmeric', qty: '1/2 tsp' },
        { name: 'Ghee', qty: '1 tsp' }
      ]
    },
    {
      name: 'Vegetable Upma',
      mealTypes: ['Breakfast'],
      compatibleDoshas: ['Vata', 'Pitta', 'Kapha'],
      calories: 320,
      protein: 9,
      carbs: 52,
      fat: 8,
      image: 'https://images.unsplash.com/photo-1598532214909-3f2f4c692f0e?w=300&h=200&fit=crop',
      rasa: ['Savory'],
      temperature: 'Warm',
      digestibility: 'Medium',
      vegType: 'veg',
      allergens: ['gluten'],
      seasons: ['any'],
      ingredients: [
        { name: 'Semolina (Rava)', qty: '60 g' },
        { name: 'Mixed Vegetables', qty: '80 g' },
        { name: 'Ghee', qty: '1 tsp' },
        { name: 'Cumin Seeds', qty: '1/2 tsp' }
      ]
    },
    {
      name: 'Mixed Veg Salad',
      mealTypes: ['Lunch', 'Evening Snack'],
      compatibleDoshas: ['Pitta', 'Kapha', 'Pitta-Kapha'],
      calories: 180,
      protein: 4,
      carbs: 28,
      fat: 3,
      image: 'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=300&h=200&fit=crop',
      rasa: ['Bitter', 'Astringent'],
      temperature: 'Cool',
      digestibility: 'Light',
      vegType: 'vegan',
      allergens: [],
      seasons: ['summer', 'any'],
      ingredients: [
        { name: 'Cucumber', qty: '80 g' },
        { name: 'Tomato', qty: '60 g' },
        { name: 'Lettuce', qty: '50 g' },
        { name: 'Lemon Juice', qty: '1 tsp' }
      ]
    },
    {
      name: 'Moong Dal Khichdi',
      mealTypes: ['Lunch', 'Dinner'],
      compatibleDoshas: ['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Vata-Kapha'],
      calories: 360,
      protein: 14,
      carbs: 58,
      fat: 6,
      image: 'https://images.unsplash.com/photo-1592578629297-137e8f1bfe66?w=300&h=200&fit=crop',
      rasa: ['Sweet'],
      temperature: 'Warm',
      digestibility: 'Light',
      vegType: 'jain',
      allergens: [],
      seasons: ['any'],
      ingredients: [
        { name: 'Mung Beans', qty: '50 g' },
        { name: 'Basmati Rice', qty: '50 g' },
        { name: 'Ghee', qty: '1 tsp' },
        { name: 'Turmeric', qty: '1/2 tsp' }
      ]
    },
    {
      name: 'Lemon Rice',
      mealTypes: ['Lunch'],
      compatibleDoshas: ['Vata', 'Kapha', 'Vata-Kapha'],
      calories: 340,
      protein: 7,
      carbs: 62,
      fat: 6,
      image: 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=300&h=200&fit=crop',
      rasa: ['Sour', 'Salty'],
      temperature: 'Warm',
      digestibility: 'Medium',
      vegType: 'veg',
      allergens: ['nuts', 'gluten'],
      seasons: ['any'],
      ingredients: [
        { name: 'Cooked Rice', qty: '150 g' },
        { name: 'Lemon', qty: '1/2' },
        { name: 'Peanuts', qty: '15 g' },
        { name: 'Cumin Seeds', qty: '1/2 tsp' }
      ]
    },
    {
      name: 'Curd Raita',
      mealTypes: ['Lunch', 'Dinner'],
      compatibleDoshas: ['Pitta'],
      calories: 120,
      protein: 6,
      carbs: 12,
      fat: 4,
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&h=200&fit=crop',
      rasa: ['Sweet'],
      temperature: 'Cool',
      digestibility: 'Light',
      vegType: 'veg',
      allergens: ['dairy'],
      seasons: ['summer', 'any'],
      ingredients: [
        { name: 'Curd (Yogurt)', qty: '100 g' },
        { name: 'Cucumber', qty: '50 g' },
        { name: 'Cumin Powder', qty: '1/4 tsp' }
      ]
    },
    {
      name: 'Oats Khichdi',
      mealTypes: ['Dinner'],
      compatibleDoshas: ['Kapha', 'Pitta-Kapha'],
      calories: 310,
      protein: 13,
      carbs: 48,
      fat: 5,
      image: 'https://images.unsplash.com/photo-1517677129300-07b130802f46?w=300&h=200&fit=crop',
      rasa: ['Savory'],
      temperature: 'Warm',
      digestibility: 'Medium',
      vegType: 'vegan',
      allergens: ['gluten'],
      seasons: ['winter', 'any'],
      ingredients: [
        { name: 'Oats', qty: '60 g' },
        { name: 'Mung Beans', qty: '40 g' },
        { name: 'Ginger', qty: '1 tsp (grated)' }
      ]
    },
    {
      name: 'Fruit Bowl',
      mealTypes: ['Mid-Morning Snack'],
      compatibleDoshas: ['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha'],
      calories: 160,
      protein: 2,
      carbs: 38,
      fat: 1,
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&h=200&fit=crop',
      rasa: ['Sweet'],
      temperature: 'Cool',
      digestibility: 'Light',
      vegType: 'vegan',
      allergens: [],
      seasons: ['summer', 'any'],
      ingredients: [
        { name: 'Seasonal Fruits', qty: '150 g' },
        { name: 'Mint', qty: 'few leaves' }
      ]
    },
    {
      name: 'Spiced Buttermilk',
      mealTypes: ['Mid-Morning Snack', 'Lunch'],
      compatibleDoshas: ['Pitta', 'Vata-Pitta'],
      calories: 90,
      protein: 5,
      carbs: 10,
      fat: 2,
      image: 'https://images.unsplash.com/photo-1613478223719-b391c277b3e1?w=300&h=200&fit=crop',
      rasa: ['Astringent'],
      temperature: 'Cool',
      digestibility: 'Light',
      vegType: 'veg',
      allergens: ['dairy'],
      seasons: ['summer', 'any'],
      ingredients: [
        { name: 'Buttermilk', qty: '200 ml' },
        { name: 'Cumin Powder', qty: '1/4 tsp' },
        { name: 'Rock Salt', qty: 'pinch' }
      ]
    },
    {
      name: 'Sprouts Salad',
      mealTypes: ['Evening Snack', 'Lunch'],
      compatibleDoshas: ['Kapha', 'Pitta-Kapha'],
      calories: 200,
      protein: 12,
      carbs: 28,
      fat: 3,
      image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=300&h=200&fit=crop',
      rasa: ['Pungent', 'Astringent'],
      temperature: 'Cool',
      digestibility: 'Light',
      vegType: 'vegan',
      allergens: [],
      seasons: ['any'],
      ingredients: [
        { name: 'Mixed Sprouts', qty: '100 g' },
        { name: 'Onion', qty: '20 g' },
        { name: 'Tomato', qty: '30 g' },
        { name: 'Lemon Juice', qty: '1 tsp' }
      ]
    },
    {
      name: 'Roasted Chana',
      mealTypes: ['Evening Snack', 'Mid-Morning Snack'],
      compatibleDoshas: ['Vata', 'Kapha', 'Vata-Kapha'],
      calories: 150,
      protein: 8,
      carbs: 22,
      fat: 3,
      image: 'https://images.unsplash.com/photo-1590080876135-2a6b76a22b3c?w=300&h=200&fit=crop',
      rasa: ['Savory'],
      temperature: 'Warm',
      digestibility: 'Light',
      vegType: 'vegan',
      allergens: [],
      seasons: ['any'],
      ingredients: [
        { name: 'Roasted Chickpeas', qty: '40 g' },
        { name: 'Rock Salt', qty: 'pinch' }
      ]
    },
    // Additional recipes for variety
    {
      name: 'Masala Dosa',
      mealTypes: ['Breakfast'],
      compatibleDoshas: ['Vata', 'Pitta', 'Kapha'],
      calories: 350,
      protein: 10,
      carbs: 58,
      fat: 8,
      image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&h=200&fit=crop',
      rasa: ['Sour', 'Salty'],
      temperature: 'Warm',
      digestibility: 'Medium',
      vegType: 'veg',
      allergens: [],
      seasons: ['any'],
      ingredients: [
        { name: 'Rice Batter', qty: '100 g' },
        { name: 'Urad Dal Batter', qty: '30 g' },
        { name: 'Potato Filling', qty: '80 g' },
        { name: 'Coconut Chutney', qty: '30 g' }
      ]
    },
    {
      name: 'Quinoa Salad',
      mealTypes: ['Lunch', 'Dinner'],
      compatibleDoshas: ['Pitta', 'Kapha'],
      calories: 280,
      protein: 10,
      carbs: 42,
      fat: 7,
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop',
      rasa: ['Bitter', 'Astringent'],
      temperature: 'Cool',
      digestibility: 'Light',
      vegType: 'vegan',
      allergens: [],
      seasons: ['summer', 'any'],
      ingredients: [
        { name: 'Quinoa', qty: '80 g' },
        { name: 'Mixed Vegetables', qty: '100 g' },
        { name: 'Olive Oil', qty: '1 tsp' },
        { name: 'Lemon Juice', qty: '1 tbsp' }
      ]
    },
    {
      name: 'Ragi Porridge',
      mealTypes: ['Breakfast'],
      compatibleDoshas: ['Kapha', 'Vata-Kapha'],
      calories: 220,
      protein: 7,
      carbs: 38,
      fat: 4,
      image: 'https://images.unsplash.com/photo-1571167530149-c72f2b4c2f66?w=300&h=200&fit=crop',
      rasa: ['Sweet'],
      temperature: 'Warm',
      digestibility: 'Light',
      vegType: 'veg',
      allergens: [],
      seasons: ['winter', 'any'],
      ingredients: [
        { name: 'Ragi Flour', qty: '40 g' },
        { name: 'Milk', qty: '200 ml' },
        { name: 'Jaggery', qty: '15 g' },
        { name: 'Cardamom', qty: 'pinch' }
      ]
    },
    {
      name: 'Palak Dal',
      mealTypes: ['Lunch', 'Dinner'],
      compatibleDoshas: ['Vata', 'Pitta', 'Kapha'],
      calories: 180,
      protein: 11,
      carbs: 24,
      fat: 4,
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop',
      rasa: ['Bitter', 'Sweet'],
      temperature: 'Warm',
      digestibility: 'Light',
      vegType: 'veg',
      allergens: [],
      seasons: ['any'],
      ingredients: [
        { name: 'Spinach', qty: '100 g' },
        { name: 'Toor Dal', qty: '40 g' },
        { name: 'Turmeric', qty: '1/2 tsp' },
        { name: 'Ghee', qty: '1 tsp' }
      ]
    },
    {
      name: 'Coconut Rice',
      mealTypes: ['Lunch'],
      compatibleDoshas: ['Vata', 'Pitta'],
      calories: 320,
      protein: 6,
      carbs: 54,
      fat: 9,
      image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=300&h=200&fit=crop',
      rasa: ['Sweet'],
      temperature: 'Warm',
      digestibility: 'Medium',
      vegType: 'veg',
      allergens: [],
      seasons: ['any'],
      ingredients: [
        { name: 'Cooked Rice', qty: '150 g' },
        { name: 'Coconut', qty: '30 g' },
        { name: 'Curry Leaves', qty: 'few' },
        { name: 'Mustard Seeds', qty: '1/2 tsp' }
      ]
    },
    {
      name: 'Herbal Tea',
      mealTypes: ['Mid-Morning Snack', 'Evening Snack'],
      compatibleDoshas: ['Vata', 'Pitta', 'Kapha'],
      calories: 25,
      protein: 0,
      carbs: 6,
      fat: 0,
      image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&h=200&fit=crop',
      rasa: ['Bitter', 'Pungent'],
      temperature: 'Warm',
      digestibility: 'Light',
      vegType: 'vegan',
      allergens: [],
      seasons: ['any'],
      ingredients: [
        { name: 'Ginger', qty: '5 g' },
        { name: 'Tulsi Leaves', qty: '5-6 leaves' },
        { name: 'Honey', qty: '1 tsp' },
        { name: 'Water', qty: '200 ml' }
      ]
    },
    {
      name: 'Vegetable Soup',
      mealTypes: ['Dinner', 'Evening Snack'],
      compatibleDoshas: ['Vata', 'Pitta', 'Kapha'],
      calories: 120,
      protein: 4,
      carbs: 20,
      fat: 2,
      image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300&h=200&fit=crop',
      rasa: ['Sweet', 'Salty'],
      temperature: 'Warm',
      digestibility: 'Light',
      vegType: 'vegan',
      allergens: [],
      seasons: ['winter', 'any'],
      ingredients: [
        { name: 'Mixed Vegetables', qty: '150 g' },
        { name: 'Vegetable Broth', qty: '200 ml' },
        { name: 'Ginger', qty: '5 g' },
        { name: 'Black Pepper', qty: 'pinch' }
      ]
    },
    {
      name: 'Millet Upma',
      mealTypes: ['Breakfast', 'Dinner'],
      compatibleDoshas: ['Kapha', 'Vata-Kapha'],
      calories: 260,
      protein: 8,
      carbs: 44,
      fat: 5,
      image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&h=200&fit=crop',
      rasa: ['Savory'],
      temperature: 'Warm',
      digestibility: 'Light',
      vegType: 'veg',
      allergens: [],
      seasons: ['any'],
      ingredients: [
        { name: 'Millet', qty: '60 g' },
        { name: 'Vegetables', qty: '80 g' },
        { name: 'Ghee', qty: '1 tsp' },
        { name: 'Mustard Seeds', qty: '1/2 tsp' }
      ]
    },
    {
      name: 'Cucumber Mint Cooler',
      mealTypes: ['Mid-Morning Snack', 'Evening Snack'],
      compatibleDoshas: ['Pitta', 'Pitta-Kapha'],
      calories: 45,
      protein: 1,
      carbs: 10,
      fat: 0,
      image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=300&h=200&fit=crop',
      rasa: ['Sweet', 'Astringent'],
      temperature: 'Cool',
      digestibility: 'Light',
      vegType: 'vegan',
      allergens: [],
      seasons: ['summer', 'any'],
      ingredients: [
        { name: 'Cucumber', qty: '100 g' },
        { name: 'Mint Leaves', qty: '10 leaves' },
        { name: 'Lemon Juice', qty: '1 tsp' },
        { name: 'Water', qty: '200 ml' }
      ]
    }
  ];

  // Helper function to get total unique recipes available for a dosha
  const getUniqueRecipeCount = (dosha) => {
    const uniqueRecipes = new Set();
    recipeCatalog.forEach(recipe => {
      if (recipe.compatibleDoshas.includes(dosha)) {
        uniqueRecipes.add(recipe.name);
      }
    });
    return uniqueRecipes.size;
  };

  const getRecipesFor = (dosha, mealType) => {
    // Apply filters before meal type fallback
    const matchesFilter = (r) => {
      if (vegType !== 'any' && r.vegType !== vegType) return false;
      if (allergies.nuts && r.allergens?.includes('nuts')) return false;
      if (allergies.dairy && r.allergens?.includes('dairy')) return false;
      if (allergies.gluten && r.allergens?.includes('gluten')) return false;
      if (season !== 'All-Season' && !(r.seasons || []).includes(season.toLowerCase()) && !(r.seasons || []).includes('any')) return false;
      return true;
    };
    let matches = recipeCatalog.filter(r => r.mealTypes.includes(mealType) && r.compatibleDoshas.includes(dosha)).filter(matchesFilter);
    if (matches.length) return matches;
    // Fallback to related meal types to avoid empty meals
    const fallbackByMeal = {
      'Mid-Morning Snack': ['Breakfast', 'Evening Snack'],
      'Evening Snack': ['Lunch', 'Breakfast'],
      'Breakfast': ['Mid-Morning Snack', 'Lunch'],
      'Lunch': ['Evening Snack'],
      'Dinner': ['Lunch']
    };
    const fb = fallbackByMeal[mealType] || [];
    for (const alt of fb) {
      matches = recipeCatalog.filter(r => r.mealTypes.includes(alt) && r.compatibleDoshas.includes(dosha)).filter(matchesFilter);
      if (matches.length) return matches;
    }
    return [];
  };

  const pickNRandom = (arr, n) => {
    const copy = [...arr];
    const out = [];
    while (out.length < n && copy.length) {
      const idx = Math.floor(Math.random() * copy.length);
      out.push(copy.splice(idx, 1)[0]);
    }
    return out;
  };

  const generateDietPlan = async (overrideDosha) => {
    // Extract dosha from event if needed
    const dosha = (overrideDosha && overrideDosha.target) ? selectedDosha : (overrideDosha || selectedDosha);
    if (!dosha) {
      console.error('No dosha selected');
      return;
    }
    
    console.log('Generating diet plan with dosha:', dosha);

    setIsGenerating(true);
    
    try {
      // Get or create patient ID
      let patientId = selectedPatient?.id || selectedPatient?._id || savedPatientId;
      
      if (!patientId) {
        // Create a temporary patient if none exists
        const tempPatient = {
          personalInfo: {
            name: patientName || 'Temporary Patient',
            email: patientEmail || 'temp@example.com',
            phone: '0000000000',
            gender: 'Other'
          },
          healthProfile: {
            prakriti: dosha,
            healthConditions: healthConditions ? [{ name: healthConditions, severity: 'Mild' }] : [],
            allergies: [],
            medications: []
          },
          lifestyle: {
            activityLevel: 'Moderate',
            sleepPattern: { bedtime: '10:00 PM', wakeTime: '6:00 AM', quality: 'Good' },
            dietPreferences: [vegType === 'veg' ? 'Vegetarian' : 'Any'],
            stressLevel: 'Low'
          },
          status: 'Active'
        };
        
        const token = localStorage.getItem('token');
        const patientRes = await axios.post('/api/patients', tempPatient, {
          headers: { Authorization: `Bearer ${token}` }
        });
        patientId = patientRes.data.patient._id;
        setSavedPatientId(patientId);
      }

      // Call backend API with season and region
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/diet-plans/generate', {
        patientId: patientId,
        dosha: dosha,
        healthConditions: healthConditions ? [healthConditions] : [],
        goals: ['Balance doshas', 'Improve health'],
        duration: 7,
        fast: false,
        season: season,
        region: region
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.dietPlan) {
        // Convert backend response to frontend format
        const backendPlan = response.data.dietPlan;
        const frontendPlan = convertBackendToFrontend(backendPlan);
        setDietPlan(frontendPlan);
        setSavedPlanId(backendPlan._id);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error generating diet plan:', error);
      console.error('Error details:', error.response?.data);
      
      // Check if it's an authentication error
      if (error.response?.status === 401) {
        navigate('/doctor-login');
        return;
      }
      
      // Enhanced fallback to client-side generation with season/region awareness
      console.log('Using fallback generation with:', { dosha: String(dosha), season, region });
      try {
        // Ensure dosha is a string and valid
        const doshaStr = String(dosha).trim();
        if (!['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha'].includes(doshaStr)) {
          throw new Error(`Invalid dosha value: ${doshaStr}`);
        }
        
        const foods = getFoodsByDosha(doshaStr);
        if (!foods || foods.length === 0) {
          throw new Error('No food items found for the selected dosha');
        }
        const weeklyPlan = generateWeeklyPlanEnhanced(foods, dosha, healthConditions, season, region);
        if (!weeklyPlan || Object.keys(weeklyPlan).length === 0) {
          throw new Error('Failed to generate diet plan with available data');
        }
        setDietPlan(weeklyPlan);
      } catch (fallbackError) {
        console.error('Fallback generation failed:', fallbackError);
        // Set an empty plan to prevent UI errors
        setDietPlan({});
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Convert backend meal format to frontend format
  const convertBackendToFrontend = (backendPlan) => {
    const frontendPlan = {
      name: backendPlan.name,
      dosha: backendPlan.dosha,
      season: backendPlan.season,
      region: backendPlan.region,
      days: {}
    };

    // Group meals by day
    backendPlan.meals.forEach(meal => {
      if (!frontendPlan.days[meal.day]) {
        frontendPlan.days[meal.day] = {};
      }
      frontendPlan.days[meal.day][meal.mealType] = meal.foods.map(food => ({
        name: food.name,
        quantity: food.quantity,
        calories: food.calories,
        protein: food.protein || 0,
        carbs: food.carbs || 0,
        fat: food.fat || 0,
        fiber: food.fiber || 0,
        notes: food.notes || ''
      }));
    });

    return frontendPlan;
  };

  // Auto-generate if dosha is provided via query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qpDosha = params.get('dosha');
    const qpSeason = params.get('season');
    const qpRegion = params.get('region');
    const qpName = params.get('name');
    const qpEmail = params.get('email');
    
    const valid = ['Vata','Pitta','Kapha','Vata-Pitta','Pitta-Kapha','Vata-Kapha'];
    const validSeasons = ['Summer', 'Winter', 'Monsoon', 'Spring', 'Autumn', 'All-Season'];
    const validRegions = ['North', 'South', 'East', 'West', 'Pan-India'];
    
    if (qpDosha && valid.includes(qpDosha)) {
      setSelectedDosha(qpDosha);
      
      // Set season and region from chatbot
      if (qpSeason && validSeasons.includes(qpSeason)) {
        setSeason(qpSeason);
      }
      if (qpRegion && validRegions.includes(qpRegion)) {
        setRegion(qpRegion);
      }
      
      // Auto-populate patient data if provided from chatbot
      if (qpName) setPatientName(decodeURIComponent(qpName));
      if (qpEmail) setPatientEmail(decodeURIComponent(qpEmail));
      
      // Generate using override to avoid relying on async state and avoid popups
      setTimeout(() => {
        generateDietPlan(qpDosha);
      }, 500); // Small delay to ensure state is set
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const getRecipeCountForMeal = (mealName) => {
    return (mealName === 'Lunch' || mealName === 'Dinner') ? 2 : 1;
  };

  // Enhanced client-side generation with season/region awareness
  const generateWeeklyPlanEnhanced = (foods, dosha, healthConditions, season, region) => {
    console.log('Generating enhanced weekly plan with:', { dosha, season, region });
    
    // Enhanced seasonal food database for client-side fallback
    const seasonalFoods = {
      Summer: {
        breakfast: ['Coconut water', 'Fresh fruit salad', 'Cucumber juice', 'Mint lassi', 'Watermelon juice'],
        lunch: ['Curd rice', 'Cucumber raita', 'Coconut chutney', 'Lemon rice', 'Buttermilk'],
        dinner: ['Light khichdi', 'Bottle gourd curry', 'Mint chutney', 'Coconut water', 'Cucumber salad']
      },
      Winter: {
        breakfast: ['Ginger tea', 'Warm milk with turmeric', 'Hot porridge', 'Sesame ladoo', 'Warm fruit'],
        lunch: ['Sarson ka saag', 'Gajar ka halwa', 'Hot dal', 'Ginger pickle', 'Warm roti'],
        dinner: ['Hot soup', 'Ginger tea', 'Warm khichdi', 'Turmeric milk', 'Cooked vegetables']
      },
      Monsoon: {
        breakfast: ['Ginger tea', 'Light upma', 'Steamed idli', 'Warm water', 'Light porridge'],
        lunch: ['Light khichdi', 'Steamed vegetables', 'Ginger pickle', 'Warm dal', 'Herbal tea'],
        dinner: ['Light soup', 'Steamed food', 'Ginger tea', 'Light khichdi', 'Warm milk']
      }
    };

    const regionalFoods = {
      North: {
        staples: ['Wheat roti', 'Paratha', 'Rajma', 'Chole', 'Paneer curry', 'Aloo sabzi'],
        specialties: ['Makki di roti', 'Sarson ka saag', 'Butter chicken', 'Dal makhani']
      },
      South: {
        staples: ['Rice', 'Sambar', 'Rasam', 'Coconut chutney', 'Idli', 'Dosa'],
        specialties: ['Lemon rice', 'Curd rice', 'Coconut curry', 'Filter coffee']
      },
      East: {
        staples: ['Rice', 'Fish curry', 'Mustard oil dishes', 'Posto curry'],
        specialties: ['Machher jhol', 'Shukto', 'Mishti doi', 'Sandesh']
      },
      West: {
        staples: ['Bajra roti', 'Jowar roti', 'Dal-rice', 'Dhokla', 'Thepla'],
        specialties: ['Undhiyu', 'Khandvi', 'Puran poli', 'Aam panna']
      }
    };

    // Get season-specific foods
    const currentSeasonFoods = season !== 'All-Season' && seasonalFoods[season] ? seasonalFoods[season] : {};
    
    // Get region-specific foods
    const currentRegionFoods = region !== 'Pan-India' && regionalFoods[region] ? regionalFoods[region] : {};

    const plan = generateWeeklyPlan(foods, dosha, healthConditions);

    // Enhance the plan with seasonal and regional foods
    const hasSeasonal = currentSeasonFoods && Object.keys(currentSeasonFoods).length > 0;
    const hasRegional = currentRegionFoods && Object.keys(currentRegionFoods).length > 0;
    if (hasSeasonal || hasRegional) {
      Object.keys(plan).forEach(day => {
        if (day === '_metadata') return;
        Object.keys(plan[day]).forEach(mealType => {
          const mealTypeKey = mealType.toLowerCase().replace(/[^a-z]/g, '');
          
          // Add seasonal foods
          if (hasSeasonal && currentSeasonFoods[mealTypeKey]) {
            const seasonalFoodList = currentSeasonFoods[mealTypeKey] || [];
            if (seasonalFoodList.length > 0) {
              const seasonalFood = seasonalFoodList[Math.floor(Math.random() * seasonalFoodList.length)];
              const seasonalFoodItem = {
                name: `${seasonalFood} (${season} special)`,
                quantity: '1 serving',
                calories: Math.floor(Math.random() * 100) + 50,
                protein: Math.floor(Math.random() * 10) + 2,
                carbs: Math.floor(Math.random() * 20) + 5,
                fat: Math.floor(Math.random() * 8) + 1,
                notes: `Seasonal ${season} food for ${dosha} constitution`
              };
              
              // Ensure foods array exists and add the seasonal food
              if (!plan[day][mealType].foods) {
                plan[day][mealType].foods = [];
              }
              plan[day][mealType].foods.unshift(seasonalFoodItem);
              
              // Update total calories
              plan[day][mealType].calories = (plan[day][mealType].calories || 0) + (seasonalFoodItem.calories || 0);
            }
          }
          
          // Add regional foods
          if (hasRegional && currentRegionFoods.staples && Array.isArray(currentRegionFoods.staples) && currentRegionFoods.staples.length > 0 && Math.random() > 0.5) {
            const regionalFood = currentRegionFoods.staples[Math.floor(Math.random() * currentRegionFoods.staples.length)];
            const regionalFoodItem = {
              name: `${regionalFood} (${region} style)`,
              quantity: '1 serving',
              calories: Math.floor(Math.random() * 150) + 100,
              protein: Math.floor(Math.random() * 12) + 3,
              carbs: Math.floor(Math.random() * 25) + 10,
              fat: Math.floor(Math.random() * 10) + 2,
              notes: `Traditional ${region} Indian preparation`
            };
            
            // Ensure foods array exists and add the regional food
            if (!plan[day][mealType].foods) {
              plan[day][mealType].foods = [];
            }
            plan[day][mealType].foods.push(regionalFoodItem);
            
            // Update total calories
            plan[day][mealType].calories = (plan[day][mealType].calories || 0) + (regionalFoodItem.calories || 0);
          }
        });
      });
      
      // Update plan name to reflect customization
      plan.name = `${dosha} ${season !== 'All-Season' ? season : ''} ${region !== 'Pan-India' ? region : ''} Diet Plan`.trim().replace(/\s+/g, ' ');
    }
    
    return plan;
  };

  const generateWeeklyPlan = (foods, dosha, conditions) => {
    const weeklyPlan = {};
    // Track used recipe names to prevent ANY duplicates across the entire week
    const usedRecipeNames = new Set();
    const maxAttempts = 3; // Retry limit if we run out of unique recipes
    let totalRecipesUsed = 0;
    let duplicatesFound = 0;

    daysList.forEach(day => {
      weeklyPlan[day] = {};
      mealTypes.forEach(meal => {
        const count = getRecipeCountForMeal(meal.name);
        let attempts = 0;
        let mealPlan;
        
        // Try to generate meal with unique recipes, with fallback
        do {
          mealPlan = generateMealPlan(foods, dosha, meal.name, conditions, usedRecipeNames, count, attempts > 0);
          attempts++;
        } while (attempts < maxAttempts && mealPlan.hasConflicts);
        
        weeklyPlan[day][meal.name] = mealPlan;
        totalRecipesUsed += mealPlan.foods.length;
        if (mealPlan.hasConflicts) duplicatesFound++;
      });
    });

    // Add metadata for debugging
    weeklyPlan._metadata = {
      totalRecipesUsed,
      uniqueRecipesUsed: usedRecipeNames.size,
      duplicatesFound,
      availableRecipes: getUniqueRecipeCount(dosha)
    };

    // Log for verification
    console.log('Weekly Plan Generation Summary:', {
      dosha,
      totalRecipesUsed,
      uniqueRecipesUsed: usedRecipeNames.size,
      duplicatesFound,
      availableRecipes: getUniqueRecipeCount(dosha),
      usedRecipesList: Array.from(usedRecipeNames)
    });

    // Final validation - check for any duplicate recipe names
    const allRecipeNames = [];
    const recipeLocations = {};
    
    Object.entries(weeklyPlan).forEach(([day, meals]) => {
      if (day === '_metadata') return;
      Object.entries(meals).forEach(([mealType, mealData]) => {
        if (mealData && mealData.foods && Array.isArray(mealData.foods)) {
          mealData.foods.forEach(food => {
            if (food && food.name) {
              const recipeName = food.name;
              allRecipeNames.push(recipeName);
              
              // Track where each recipe appears
              if (!recipeLocations[recipeName]) {
                recipeLocations[recipeName] = [];
              }
              recipeLocations[recipeName].push(`${day} ${mealType}`);
            }
          });
        }
      });
    });
    
    // Find recipes that appear more than once
    const duplicateRecipes = [];
    Object.entries(recipeLocations).forEach(([recipeName, locations]) => {
      if (locations.length > 1) {
        duplicateRecipes.push({
          recipe: recipeName,
          locations: locations,
          count: locations.length
        });
      }
    });
    
    if (duplicateRecipes.length > 0) {
      console.error('🚨 DUPLICATE RECIPES FOUND IN WEEKLY PLAN:');
      duplicateRecipes.forEach(dup => {
        console.error(`   ${dup.recipe} appears ${dup.count} times: ${dup.locations.join(', ')}`);
      });
      weeklyPlan._metadata.duplicatesDetected = duplicateRecipes;
    } else {
      console.log('✅ NO DUPLICATE RECIPES - All recipes are unique across the week!');
      console.log(`   Used ${allRecipeNames.length} total recipe slots with ${new Set(allRecipeNames).size} unique recipes`);
      weeklyPlan._metadata.duplicatesDetected = [];
    }

    return weeklyPlan;
  };

  const generateMealPlan = (foods, dosha, mealType, conditions, usedRecipeNames = new Set(), count = 1, allowRepeats = false) => {
    // Switch to recipe-based generation
    const recipes = getRecipesFor(dosha, mealType);
    
    // Filter out already used recipes unless we're in fallback mode
    const availableRecipes = allowRepeats ? recipes : recipes.filter(r => !usedRecipeNames.has(r.name));
    let pool = availableRecipes.length ? availableRecipes : recipes; // fallback to all if none available
    let chosen = [];
    let hasConflicts = false;
    
    // Debug logging
    if (!allowRepeats) {
      console.log(`Generating ${mealType}:`, {
        totalRecipes: recipes.length,
        availableRecipes: availableRecipes.length,
        alreadyUsed: Array.from(usedRecipeNames),
        requestedCount: count
      });
    }
    
    if (pool.length) {
      // Aim for meal calorie target
      const mealTarget = Math.round((targets.calories || 0) * (mealCalorieShare[mealType] || 0.2));
      let total = 0;
      const seenInThisMeal = new Set();
      
      // First, pick up to 'count' unique items for this meal
      const picks = pickNRandom(pool, Math.min(count, pool.length));
      picks.forEach(p => {
        if (!seenInThisMeal.has(p.name)) {
          chosen.push(p);
          seenInThisMeal.add(p.name);
          // Only add to global used list if not in fallback mode
          if (!allowRepeats) {
            if (usedRecipeNames.has(p.name)) {
              console.warn(`⚠️ ATTEMPTING TO ADD DUPLICATE: ${p.name} already used this week`);
              hasConflicts = true;
              return; // Skip this recipe
            }
            usedRecipeNames.add(p.name);
          } else {
            hasConflicts = true; // Mark that we had to repeat
          }
          total += (p.calories || 0);
        }
      });
      
      // If below target and we have more unique recipes available
      const cap = count + 1; // smaller extension to avoid too many items
      const remainingPool = pool.filter(p => !seenInThisMeal.has(p.name));
      while (total < mealTarget - 150 && chosen.length < cap && remainingPool.length) {
        const next = remainingPool.splice(Math.floor(Math.random() * remainingPool.length), 1)[0];
        if (!seenInThisMeal.has(next.name)) {
          chosen.push(next);
          seenInThisMeal.add(next.name);
          if (!allowRepeats) {
            if (usedRecipeNames.has(next.name)) {
              console.warn(`⚠️ ATTEMPTING TO ADD DUPLICATE: ${next.name} already used this week`);
              hasConflicts = true;
              continue; // Skip this recipe
            }
            usedRecipeNames.add(next.name);
          } else {
            hasConflicts = true;
          }
          total += (next.calories || 0);
        }
      }
    }
    // Final fallback: build a simple recipe from foods if still empty
    if (chosen.length === 0) {
      const pool = foods.slice(0, 3);
      if (pool.length) {
        const synthetic = {
          name: `${mealType} Bowl`,
          calories: pool.reduce((s, f) => s + (f.calories || 0), 0),
          image: pool[0].image,
          ingredients: pool.map(f => ({ name: f.name, qty: '~' })),
          mealTypes: [mealType],
          compatibleDoshas: [dosha]
        };
        chosen = new Array(count).fill(0).map((_, i) => ({ ...synthetic, name: `${synthetic.name}${count > 1 ? ` #${i+1}` : ''}` }));
      }
    }
    const foodsOut = chosen.map(r => ({
      name: r.name || 'Unknown Recipe',
      category: 'Recipe',
      calories: r.calories || 0,
      protein: r.protein || 0,
      carbs: r.carbs || 0,
      fat: r.fat || 0,
      image: r.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop',
      ingredients: r.ingredients || []
    }));

    const totalCalories = foodsOut.reduce((sum, f) => sum + (f.calories || 0), 0);
    
    // Debug logging for calorie calculation
    console.log(`${mealType} calories:`, {
      foods: foodsOut.map(f => ({ name: f.name, calories: f.calories })),
      totalCalories
    });
    
    return {
      foods: foodsOut || [],
      notes: generateMealNotes(dosha, mealType, conditions) || [],
      calories: totalCalories,
      hasConflicts: hasConflicts // Track if we had to use repeats
    };
  };

  const generateMealNotes = (dosha, mealType, conditions) => {
    const notes = [];
    
    if (dosha === 'Vata') {
      notes.push('Warm, cooked foods are recommended');
      notes.push('Include healthy fats like ghee');
    } else if (dosha === 'Pitta') {
      notes.push('Cooling foods and drinks');
      notes.push('Avoid spicy and sour foods');
    } else if (dosha === 'Kapha') {
      notes.push('Light, warm, and dry foods');
      notes.push('Include pungent spices');
    }

    if (conditions.includes('Diabetes')) {
      notes.push('Monitor carbohydrate intake');
    }
    if (conditions.includes('Digestive Issues')) {
      notes.push('Include digestive spices like ginger and cumin');
    }

    return notes;
  };

  const getDoshaColor = (dosha) => {
    switch (dosha) {
      case 'Vata': return 'dosha-vata';
      case 'Pitta': return 'dosha-pitta';
      case 'Kapha': return 'dosha-kapha';
      default: return 'bg-gray-200';
    }
  };

  // High-level Ayurvedic guidance based on dosha
  const getDoshaGuidance = (dosha) => {
    switch (dosha) {
      case 'Vata':
        return {
          summary: 'Warm, grounding, and nourishing foods to balance dryness and cold.',
          prefer: ['Sweet', 'Sour', 'Salty'],
          reduce: ['Bitter', 'Pungent', 'Astringent'],
          temperature: 'Warm/Hot',
          digestibility: 'Easy-to-digest, well-cooked with healthy fats (ghee)'
        };
      case 'Pitta':
        return {
          summary: 'Cooling, hydrating, and mildly sweet foods to calm heat.',
          prefer: ['Sweet', 'Bitter', 'Astringent'],
          reduce: ['Sour', 'Salty', 'Pungent'],
          temperature: 'Cool/Room temperature',
          digestibility: 'Light to medium; avoid very oily or spicy foods'
        };
      case 'Kapha':
        return {
          summary: 'Light, warm, and stimulating foods to reduce heaviness and dampness.',
          prefer: ['Pungent', 'Bitter', 'Astringent'],
          reduce: ['Sweet', 'Sour', 'Salty'],
          temperature: 'Warm/Hot',
          digestibility: 'Light; favor spices and high-fiber foods'
        };
      case 'Vata-Pitta':
        return {
          summary: 'Favor warm but not overly heating meals; hydrate and include healthy fats.',
          prefer: ['Sweet'],
          reduce: ['Very spicy', 'Very dry foods'],
          temperature: 'Warm',
          digestibility: 'Easy-to-digest, well-cooked'
        };
      case 'Pitta-Kapha':
        return {
          summary: 'Light, cooling meals with spices in moderation; avoid heavy sweets and oils.',
          prefer: ['Bitter', 'Astringent'],
          reduce: ['Sweet', 'Salty', 'Very spicy'],
          temperature: 'Room temperature/Cool',
          digestibility: 'Light, low-oil'
        };
      case 'Vata-Kapha':
        return {
          summary: 'Warm, lightly spiced meals; avoid cold and heavy foods.',
          prefer: ['Pungent', 'Salty'],
          reduce: ['Cold', 'Heavy sweets'],
          temperature: 'Warm/Hot',
          digestibility: 'Light to medium'
        };
      default:
        return {
          summary: 'Balanced, seasonal, freshly prepared meals.',
          prefer: ['Sweet'],
          reduce: ['Excess spice/oil'],
          temperature: 'Warm',
          digestibility: 'Easy-to-digest'
        };
    }
  };

  const handlePrint = () => window.print();

  const exportDietPlan = () => {
    if (!dietPlan) return;
    
    const dataStr = JSON.stringify(dietPlan, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `diet-plan-${selectedDosha}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Render loading state for chatbot flow
  if (isChatbotFlow && (isLoading || isGenerating)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Creating your personalized {selectedDosha} diet plan...</p>
          <p className="mt-2 text-sm text-gray-500">Optimizing for {urlSeason} season in {urlRegion} India</p>
          <p className="mt-2 text-xs text-gray-400">Patient: {urlPatientName}</p>
        </div>
      </div>
    );
  }

  // Simplified view for chatbot flow
  if (false) { // Disabled - always show full interface for doctor customization
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        {/* Simplified Header */}
        <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-emerald-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center text-gray-600 hover:text-emerald-600 transition-colors mr-4"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Chat
                </button>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <Utensils className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Your Personalized Diet Plan</h1>
                    <p className="text-sm text-gray-600">Based on your {selectedDosha} constitution</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Preferences Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Preferences</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Season 🌿</h3>
                <select 
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white"
                >
                  <option value="All-Season">All Season</option>
                  <option value="Summer">Summer (Cooling foods)</option>
                  <option value="Winter">Winter (Warming foods)</option>
                  <option value="Monsoon">Monsoon (Light, digestible)</option>
                  <option value="Spring">Spring (Detoxifying)</option>
                  <option value="Autumn">Autumn (Grounding)</option>
                </select>
                {season !== 'All-Season' && (
                  <p className="text-sm text-emerald-700 mt-2">
                    {season === 'Summer' && '🥒 Includes cooling foods like cucumber, coconut water, melons'}
                    {season === 'Winter' && '🔥 Includes warming spices like ginger, cinnamon, hot soups'}
                    {season === 'Monsoon' && '☔ Light, easily digestible foods to support immunity'}
                    {season === 'Spring' && '🌱 Fresh, detoxifying foods to cleanse after winter'}
                    {season === 'Autumn' && '🍂 Grounding foods to prepare for winter'}
                  </p>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Region 🗺️</h3>
                <select 
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full border-2 border-blue-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                >
                  <option value="Pan-India">Pan India</option>
                  <option value="North">North India (Wheat, Dairy)</option>
                  <option value="South">South India (Rice, Coconut)</option>
                  <option value="East">East India (Rice, Fish)</option>
                  <option value="West">West India (Millets, Legumes)</option>
                </select>
                {region !== 'Pan-India' && (
                  <p className="text-sm text-blue-700 mt-2">
                    {region === 'North' && '🌾 Wheat-based meals, dairy products, seasonal vegetables'}
                    {region === 'South' && '🥥 Rice preparations, coconut-based curries, fermented foods'}
                    {region === 'East' && '🍚 Rice-based meals, mustard oil, fish preparations'}
                    {region === 'West' && '🌾 Millet rotis, legume-based dishes, regional spices'}
                  </p>
                )}
              </div>
            </div>
            
            {/* Regenerate Button */}
            <div className="mt-6 text-center">
              <button
                onClick={handleGeneratePlan}
                disabled={isGenerating}
                className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="-ml-1 mr-2 h-5 w-5" />
                    Regenerate Plan
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Diet Plan Display */}
          {dietPlan ? (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Your {selectedDosha} Diet Plan</h2>
              {/* Add diet plan display here */}
              <div className="space-y-6">
                {Object.entries(dietPlan).filter(([day]) => day !== '_metadata').map(([day, meals]) => (
                  <div key={day} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                    <h3 className="text-xl font-semibold text-emerald-700 mb-4">{day}</h3>
                    <div className="space-y-4">
                      {Object.entries(meals).map(([mealType, mealData]) => (
                        <div key={mealType} className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-800 flex items-center">
                            {mealType === 'Breakfast' && '☀️'}
                            {mealType === 'Lunch' && '🌞'}
                            {mealType === 'Dinner' && '🌙'}
                            {' '}{mealType}
                          </h4>
                          {mealData?.foods?.length > 0 ? (
                            <ul className="mt-2 space-y-1">
                              {mealData.foods.map((food, idx) => (
                                <li key={idx} className="text-gray-700">• {food.name}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-500 text-sm mt-1">No items selected</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <p className="text-gray-500">No diet plan generated yet. Adjust your preferences and click "Generate Plan".</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Original view for regular usage
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/doctor-dashboard')}
                className="flex items-center text-gray-600 hover:text-emerald-600 transition-colors mr-4"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Utensils className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Diet Plan Generator</h1>
                  <p className="text-sm text-gray-600">Personalized Ayurvedic Nutrition • {season !== 'All-Season' ? season : ''} {region !== 'Pan-India' ? region : ''}</p>
                </div>
              </div>
            </div>
            {selectedPatient && (
              <div className="hidden md:flex items-center space-x-3 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200">
                <Heart className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800">
                  {selectedPatient.name} ({selectedPatient.prakriti})
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!dietPlan ? (
          /* Modern Diet Plan Configuration */
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12"
            >
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-6">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Generate Your Perfect Diet Plan
                </h2>
                <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed">
                  Create personalized meal plans based on ancient Ayurvedic wisdom and your unique constitution
                </p>
              </div>

              <div className="space-y-8">
                {/* Patient Selection */}
                {selectedPatient && (
                  <div className="ayur-card-soft rounded-xl p-4">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-[var(--ayur-herbal)] mr-2" />
                      <span className="text-[var(--ayur-herbal)] font-medium">
                        Selected Patient: {selectedPatient.name} ({selectedPatient.prakriti})
                      </span>
                    </div>
                  </div>
                )}

                {/* Enhanced Dosha Selection */}
                <div className="mb-10">
                  <label className="block text-2xl font-bold text-gray-800 mb-6 text-center">
                    Choose Your Constitution (Prakriti)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {doshaTypes.map((dosha) => {
                      const isSelected = selectedDosha === dosha.value;
                      const doshaColors = {
                        'Vata': 'from-purple-500 to-indigo-600',
                        'Pitta': 'from-orange-500 to-red-600', 
                        'Kapha': 'from-green-500 to-emerald-600',
                        'Vata-Pitta': 'from-purple-500 to-orange-500',
                        'Pitta-Kapha': 'from-orange-500 to-green-500',
                        'Vata-Kapha': 'from-purple-500 to-green-500'
                      };
                      return (
                        <motion.div
                          key={dosha.value}
                          whileHover={{ scale: 1.05, y: -5 }}
                          whileTap={{ scale: 0.98 }}
                          className={`relative p-6 rounded-2xl cursor-pointer transition-all duration-300 ${
                            isSelected
                              ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 shadow-xl'
                              : 'bg-white border-2 border-gray-200 hover:border-emerald-300 hover:shadow-lg'
                          }`}
                          onClick={() => setSelectedDosha(dosha.value)}
                        >
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 bg-gradient-to-br ${doshaColors[dosha.value] || 'from-gray-400 to-gray-600'} flex items-center justify-center`}>
                            <span className="text-2xl font-bold text-white">{dosha.value.charAt(0)}</span>
                          </div>
                          <h3 className="font-bold text-xl text-center text-gray-800 mb-3">
                            {dosha.label}
                          </h3>
                          <p className="text-sm text-gray-600 text-center leading-relaxed">
                            {dosha.description}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Season & Region Selection - Prominent Position */}
                <div className="mb-10">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
                    🌿 Customize Your Diet Plan
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border-2 border-emerald-200">
                      <label className="block text-lg font-semibold text-gray-800 mb-3">Season 🌿</label>
                      <select 
                        value={season} 
                        onChange={(e)=>setSeason(e.target.value)} 
                        className="w-full border-2 border-emerald-300 rounded-lg px-4 py-3 text-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white"
                      >
                        <option value="All-Season">All Season</option>
                        <option value="Summer">Summer (Cooling foods)</option>
                        <option value="Winter">Winter (Warming foods)</option>
                        <option value="Monsoon">Monsoon (Light, digestible)</option>
                        <option value="Spring">Spring (Detoxifying)</option>
                        <option value="Autumn">Autumn (Grounding)</option>
                      </select>
                      {season !== 'All-Season' && (
                        <p className="text-sm text-emerald-700 mt-2 font-medium">
                          {season === 'Summer' && '🥒 Includes cooling foods like cucumber, coconut water, melons'}
                          {season === 'Winter' && '🔥 Includes warming spices like ginger, cinnamon, hot soups'}
                          {season === 'Monsoon' && '☔ Light, easily digestible foods to support immunity'}
                          {season === 'Spring' && '🌱 Fresh, detoxifying foods to cleanse after winter'}
                          {season === 'Autumn' && '🍂 Grounding foods to prepare for winter'}
                        </p>
                      )}
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-200">
                      <label className="block text-lg font-semibold text-gray-800 mb-3">Region 🗺️</label>
                      <select 
                        value={region} 
                        onChange={(e)=>setRegion(e.target.value)} 
                        className="w-full border-2 border-blue-300 rounded-lg px-4 py-3 text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                      >
                        <option value="Pan-India">Pan India</option>
                        <option value="North">North India (Wheat, Dairy)</option>
                        <option value="South">South India (Rice, Coconut)</option>
                        <option value="East">East India (Rice, Fish)</option>
                        <option value="West">West India (Millets, Legumes)</option>
                      </select>
                      {region !== 'Pan-India' && (
                        <p className="text-sm text-blue-700 mt-2 font-medium">
                          {region === 'North' && '🌾 Wheat-based meals, dairy products, seasonal vegetables'}
                          {region === 'South' && '🥥 Rice preparations, coconut-based curries, fermented foods'}
                          {region === 'East' && '🍚 Rice-based meals, mustard oil, fish preparations'}
                          {region === 'West' && '🌾 Millet rotis, legume-based dishes, regional spices'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Enhanced Health Conditions */}
                <div className="mb-10">
                  <label className="block text-xl font-bold text-gray-800 mb-4">
                    <AlertCircle className="w-5 h-5 inline mr-2 text-emerald-600" />
                    Health Conditions & Preferences
                  </label>
                  <div className="relative">
                    <textarea
                      value={healthConditions}
                      onChange={(e) => setHealthConditions(e.target.value)}
                      placeholder="Share any health conditions, allergies, dietary restrictions, or specific goals (e.g., weight management, digestive issues, diabetes)..."
                      className="w-full p-6 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 resize-none transition-all duration-200 text-gray-700 placeholder-gray-400"
                      rows="4"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                      {healthConditions.length}/500
                    </div>
                  </div>
                </div>

                {/* Enhanced Filters & Targets */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center">
                      <Leaf className="w-5 h-5 mr-2 text-emerald-600" />
                      Dietary Preferences
                    </h4>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Diet Preference</label>
                      <select value={vegType} onChange={(e)=>setVegType(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                        <option value="any">Any</option>
                        <option value="veg">Vegetarian</option>
                        <option value="vegan">Vegan</option>
                        <option value="jain">Jain</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Allergies</label>
                      <div className="flex items-center gap-4">
                        <label className="text-sm text-gray-700"><input type="checkbox" className="mr-2" checked={allergies.nuts} onChange={(e)=>setAllergies(prev=>({...prev, nuts:e.target.checked}))}/>Nuts</label>
                        <label className="text-sm text-gray-700"><input type="checkbox" className="mr-2" checked={allergies.dairy} onChange={(e)=>setAllergies(prev=>({...prev, dairy:e.target.checked}))}/>Dairy</label>
                        <label className="text-sm text-gray-700"><input type="checkbox" className="mr-2" checked={allergies.gluten} onChange={(e)=>setAllergies(prev=>({...prev, gluten:e.target.checked}))}/>Gluten</label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Rotation Window (days)</label>
                      <input type="number" min="1" max="7" value={rotationWindow} onChange={(e)=>setRotationWindow(Number(e.target.value||3))} className="w-full border rounded-lg px-3 py-2" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-health.dark">Targets</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Calories (kcal)</label>
                        <input type="number" min="800" max="4000" value={targets.calories} onChange={(e)=>setTargets(prev=>({...prev, calories: Number(e.target.value||0)}))} className="w-full border rounded-lg px-3 py-2" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Protein (g)</label>
                        <input type="number" min="0" max="300" value={targets.protein} onChange={(e)=>setTargets(prev=>({...prev, protein: Number(e.target.value||0)}))} className="w-full border rounded-lg px-3 py-2" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Carbs (g)</label>
                        <input type="number" min="0" max="600" value={targets.carbs} onChange={(e)=>setTargets(prev=>({...prev, carbs: Number(e.target.value||0)}))} className="w-full border rounded-lg px-3 py-2" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Fat (g)</label>
                        <input type="number" min="0" max="200" value={targets.fat} onChange={(e)=>setTargets(prev=>({...prev, fat: Number(e.target.value||0)}))} className="w-full border rounded-lg px-3 py-2" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Meals aim for calorie distribution across the day. Macros are placeholders in this demo and can be enforced in a later step.</p>
                  </div>
                </div>

                {/* Enhanced Generate Button */}
                <div className="text-center pt-8">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(16, 185, 129, 0.3)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={generateDietPlan}
                    disabled={!selectedDosha || isGenerating}
                    className={`relative px-12 py-5 rounded-2xl text-xl font-bold transition-all duration-300 ${
                      selectedDosha && !isGenerating
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-2xl hover:shadow-emerald-500/25'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isGenerating ? (
                      <div className="flex items-center">
                        <div className="w-6 h-6 mr-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Crafting Your Perfect Plan...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div className="w-8 h-8 mr-3 bg-white/20 rounded-full flex items-center justify-center">
                          <Zap className="w-5 h-5" />
                        </div>
                        Generate My Diet Plan
                      </div>
                    )}
                    {selectedDosha && !isGenerating && (
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
                    )}
                  </motion.button>
                  
                  {selectedDosha && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-4 text-sm text-gray-600"
                    >
                      ✨ Creating a personalized 7-day meal plan for {selectedDosha} constitution
                    </motion.p>
                  )}
                </div>
              </div>
              {! (selectedPatient?.id || selectedPatient?._id || savedPatientId) && (
                <div className="mt-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-3 print-hidden">
                  No patient selected. Use "Save to Patient History" below to save this plan under a patient.
                </div>
              )}
              {savedPlanId && (
                <div className="mt-3 bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 print-hidden">
                  Plan submitted. You can view it in Doctor Dashboard or refresh the patient's plan page.
                </div>
              )}
            </motion.div>
          </div>
        ) : (
          /* Generated Diet Plan */
          <> 
            {/* Enhanced Plan Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <div className="mb-4 md:mb-0">
                    <div className="flex items-center mb-2">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold">
                          Your {selectedDosha} Diet Plan
                        </h2>
                        <p className="text-emerald-100">
                          {season !== 'All-Season' && `${season} • `}
                          {region !== 'Pan-India' && `${region} • `}
                          Personalized 7-day meal plan • Generated {new Date().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setRecipeName('');
                        setRecipeItems([]);
                        setRecipeSearch('');
                        setRecipeDay(daysList[0]);
                        setRecipeMeal(mealTypes[2].name);
                        setShowRecipeModal(true);
                      }}
                      className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-xl hover:bg-white/30 transition-all duration-200"
                    >
                      <Plus className="w-4 h-4 mr-2 inline" />
                      Add Recipe
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDietPlan(null)}
                      className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-xl hover:bg-white/30 transition-all duration-200"
                    >
                      <RefreshCw className="w-4 h-4 mr-2 inline" />
                      Regenerate
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePrint}
                      className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-xl hover:bg-white/30 transition-all duration-200"
                    >
                      <Printer className="w-4 h-4 mr-2 inline" />
                      Print
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={exportDietPlan}
                      className="px-4 py-2 bg-white text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all duration-200 font-medium"
                    >
                      <FileDown className="w-4 h-4 mr-2 inline" />
                      Export
                    </motion.button>
                  </div>
                </div>
                {healthConditions && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                    <div className="flex items-start">
                      <Info className="w-5 h-5 text-emerald-200 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-emerald-100 mb-1">Health Considerations</h4>
                        <p className="text-emerald-50 text-sm leading-relaxed">{healthConditions}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Ayurvedic Guidance Summary */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="ayur-card rounded-2xl shadow p-5"
            >
              {(() => {
                const g = getDoshaGuidance(selectedDosha);
                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Guidance</p>
                      <p className="text-sm text-gray-800">{g.summary}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Prefer Tastes</p>
                      <p className="text-sm" style={{color:'var(--ayur-herbal)'}}>{g.prefer.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Reduce Tastes</p>
                      <p className="text-sm" style={{color:'var(--ayur-saffron)'}}>{g.reduce.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Temperature / Digestibility</p>
                      <p className="text-sm text-gray-800">{g.temperature}; {g.digestibility}</p>
                    </div>
                  </div>
                );
              })()}
            </motion.div>


            {/* Daily Totals Summary */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="ayur-card rounded-2xl p-5 mb-6"
            >
              <h3 className="text-lg font-semibold ayur-title mb-4">Daily Calorie Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {Object.entries(dietPlan).filter(([day]) => day !== '_metadata').map(([day, meals]) => {
                  const dayTotal = Object.values(meals || {}).reduce((total, meal) => {
                    return total + (meal?.calories || 0);
                  }, 0);
                  
                  return (
                    <div key={day} className="text-center p-3 rounded-xl" style={{background: 'var(--card-bg-soft)'}}>
                      <div className="text-sm font-medium text-gray-600 mb-1">{day.slice(0, 3)}</div>
                      <div className="text-xl font-bold ayur-title">{dayTotal}</div>
                      <div className="text-xs text-gray-500">calories</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t" style={{borderColor: 'var(--border-soft)'}}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Weekly Total:</span>
                  <span className="text-lg font-bold ayur-title">
                    {Object.entries(dietPlan).filter(([day]) => day !== '_metadata').reduce((weekTotal, [day, meals]) => {
                      const dayTotal = Object.values(meals || {}).reduce((total, meal) => total + (meal?.calories || 0), 0);
                      return weekTotal + dayTotal;
                    }, 0)} calories
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm font-medium text-gray-600">Daily Average:</span>
                  <span className="text-md font-semibold" style={{color: 'var(--ayur-herbal)'}}>
                    {Math.round(Object.entries(dietPlan).filter(([day]) => day !== '_metadata').reduce((weekTotal, [day, meals]) => {
                      const dayTotal = Object.values(meals || {}).reduce((total, meal) => total + (meal?.calories || 0), 0);
                      return weekTotal + dayTotal;
                    }, 0) / 7)} calories/day
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Enhanced Weekly Calendar */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 mb-12">
              {Object.entries(dietPlan).filter(([day]) => day !== '_metadata').map(([day, meals], dayIndex) => {
                const dayTotal = Object.values(meals || {}).reduce((total, meal) => total + (meal?.calories || 0), 0);
                const dayColors = [
                  'from-rose-500 to-pink-600',
                  'from-orange-500 to-amber-600', 
                  'from-yellow-500 to-orange-600',
                  'from-green-500 to-emerald-600',
                  'from-blue-500 to-cyan-600',
                  'from-indigo-500 to-purple-600',
                  'from-purple-500 to-pink-600'
                ];
                
                return (
                  <motion.div
                    key={day}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: dayIndex * 0.1 }}
                    className="bg-white rounded-3xl shadow-xl hover:shadow-2xl p-6 transition-all duration-300 hover:-translate-y-2 border border-gray-100"
                  >
                    <div className="text-center mb-6">
                      <div className={`w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${dayColors[dayIndex]} flex items-center justify-center shadow-lg`}>
                        <span className="text-white font-bold text-lg">{day.slice(0, 3)}</span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-800 mb-1">{day}</h3>
                      <div className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                        <Zap className="w-3 h-3 mr-1" />
                        {dayTotal} cal
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {Object.entries(meals || {}).map(([mealName, mealData]) => {
                        const safeMealData = {
                          foods: mealData?.foods || [],
                          calories: mealData?.calories || 0,
                          notes: mealData?.notes || [],
                          ...mealData
                        };
                        
                        const mealIcons = {
                          'Breakfast': '🌅',
                          'Mid-Morning Snack': '🍎', 
                          'Lunch': '🍽️',
                          'Evening Snack': '☕',
                          'Dinner': '🌙'
                        };
                        
                        return (
                          <motion.div
                            key={mealName}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 cursor-pointer hover:from-emerald-50 hover:to-teal-50 transition-all duration-200 border border-gray-200 hover:border-emerald-300"
                            onClick={() => {
                              setSelectedMeal({ day, mealName, ...safeMealData });
                              setShowModal(true);
                            }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <span className="text-lg mr-2">{mealIcons[mealName] || '🍴'}</span>
                                <h4 className="font-semibold text-sm text-gray-800">{mealName}</h4>
                              </div>
                              <span className="text-xs px-2 py-1 bg-white rounded-full text-emerald-600 font-medium border border-emerald-200">
                                {safeMealData.calories || 0} cal
                              </span>
                            </div>
                            <div className="space-y-1">
                              {safeMealData.foods.slice(0, 2).map((food, index) => {
                                if (!food || !food.name) return null;
                                return (
                                  <div key={index} className="text-xs text-gray-600 bg-white/60 rounded-lg px-2 py-1">
                                    {food.name}
                                  </div>
                                );
                              })}
                              {safeMealData.foods.length > 2 && (
                                <div className="text-xs text-gray-500 italic px-2">
                                  +{safeMealData.foods.length - 2} more items
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Enhanced Submit Diet Plan Section - Moved to End */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-gradient-to-br from-white via-emerald-50 to-teal-50 rounded-3xl shadow-2xl border-2 border-emerald-200 p-8 md:p-12 text-center relative overflow-hidden"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
              </div>
              
              <div className="relative z-10">
                {/* Header */}
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-6 shadow-lg">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
                    Save Diet Plan to Records
                  </h3>
                  <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                    Complete your patient's profile and save this personalized diet plan to your medical records system
                  </p>
                </div>
                
                {/* Patient Info Form */}
                <div className="max-w-2xl mx-auto mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-left">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <User className="w-4 h-4 inline mr-2" />
                        Patient Name
                      </label>
                      <input 
                        value={patientName} 
                        onChange={(e)=>setPatientName(e.target.value)} 
                        className="w-full border-2 border-gray-200 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all duration-200 text-gray-700 placeholder-gray-400" 
                        placeholder="Enter patient's full name" 
                      />
                    </div>
                    <div className="text-left">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <Heart className="w-4 h-4 inline mr-2" />
                        Email Address
                      </label>
                      <input 
                        value={patientEmail} 
                        onChange={(e)=>setPatientEmail(e.target.value)} 
                        className="w-full border-2 border-gray-200 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all duration-200 text-gray-700 placeholder-gray-400" 
                        placeholder="Enter email address" 
                        type="email"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Submit Button */}
                <div className="mb-6">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 25px 50px rgba(16, 185, 129, 0.4)" }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!patientName || !patientEmail || saveLoading || (savedPatientId && autoSubmitted)}
                    onClick={async ()=>{
                      try {
                        setSaveLoading(true);
                        
                        // First save patient if not already saved
                        let patientId = savedPatientId;
                        if (!patientId) {
                          const payload = {
                            personalInfo: {
                              name: patientName,
                              email: patientEmail
                            },
                            healthProfile: {
                              prakriti: selectedDosha,
                              healthConditions: healthConditions ? [healthConditions] : []
                            },
                            lifestyle: {}
                          };
                          const res = await addPatient(payload);
                          if (res?.success && res.patient?._id) {
                            patientId = res.patient._id;
                            setSavedPatientId(patientId);
                          } else {
                            return;
                          }
                        }
                        
                        // Then save the diet plan
                        if (patientId && dietPlan) {
                          await savePlanToServer(patientId, dietPlan, selectedDosha);
                          setAutoSubmitted(true);
                          
                          // Navigate to homepage after successful submission
                          setTimeout(() => {
                            navigate('/');
                          }, 2000);
                        }
                      } catch(e) {
                        console.error('Submit error:', e);
                      } finally {
                        setSaveLoading(false);
                      }
                    }}
                    className={`relative px-12 py-5 rounded-2xl text-xl font-bold transition-all duration-300 shadow-2xl ${
                      !patientName || !patientEmail || saveLoading || (savedPatientId && autoSubmitted)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700'
                    }`}
                  >
                    {saveLoading ? (
                      <div className="flex items-center">
                        <div className="w-6 h-6 mr-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving to Records...
                      </div>
                    ) : (savedPatientId && autoSubmitted) ? (
                      <div className="flex items-center">
                        <CheckCircle className="w-6 h-6 mr-3" />
                        ✅ Saved Successfully!
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div className="w-8 h-8 mr-3 bg-white/20 rounded-full flex items-center justify-center">
                          <Download className="w-5 h-5" />
                        </div>
                        Save Diet Plan to Records
                      </div>
                    )}
                    
                    {/* Hover Effect */}
                    {!(!patientName || !patientEmail || saveLoading || (savedPatientId && autoSubmitted)) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
                    )}
                  </motion.button>
                </div>
                
                {/* Success Message */}
                {(savedPatientId && autoSubmitted) && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-6"
                  >
                    <div className="flex items-center justify-center mb-3">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-green-800 text-lg">Diet Plan Saved Successfully!</h4>
                        <p className="text-green-700">Plan saved for <strong>{patientName}</strong></p>
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-xl p-4">
                      <p className="text-sm text-green-700 mb-2">
                        <strong>✅ What's been saved:</strong>
                      </p>
                      <ul className="text-sm text-green-600 space-y-1">
                        <li>• Patient profile with {selectedDosha} constitution</li>
                        <li>• Complete 7-day personalized meal plan</li>
                        <li>• Nutritional guidelines and recommendations</li>
                        <li>• Accessible from Doctor Dashboard</li>
                        <li>• 🏠 Redirecting to homepage in 2 seconds...</li>
                      </ul>
                    </div>
                  </motion.div>
                )}
                
                {/* Info Text */}
                <div className="max-w-xl mx-auto">
                  <div className="bg-white/60 rounded-2xl p-4 border border-emerald-200">
                    <p className="text-sm text-gray-600 flex items-center justify-center">
                      <Info className="w-4 h-4 mr-2 text-emerald-600" />
                      This will create a patient record and save the diet plan to your practice management system
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* Enhanced Meal Detail Modal */}
      {showModal && selectedMeal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white relative">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-1">
                    {selectedMeal.mealName}
                  </h3>
                  <p className="text-emerald-100">
                    {selectedMeal.day} • {selectedMeal.calories || 0} calories
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowModal(false)}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <span className="text-xl font-light">×</span>
                </motion.button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">

              <div className="space-y-8">
                {/* Enhanced Foods Section */}
                <div>
                  <div className="flex items-center mb-6">
                    <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center mr-3">
                      <Utensils className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-800">Meal Components</h4>
                  </div>
                  <div className="grid gap-4">
                    {(selectedMeal?.foods || []).map((food, index) => {
                      if (!food) return null;
                      return (
                        <motion.div 
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 hover:from-emerald-50 hover:to-teal-50 transition-all duration-200 border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="relative">
                                <img
                                  src={food.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop'}
                                  alt={food.name || 'Recipe'}
                                  className="w-16 h-16 rounded-2xl object-cover shadow-md"
                                />
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">{index + 1}</span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <h5 className="font-bold text-gray-800 text-lg">{food.name || 'Unknown Recipe'}</h5>
                                <p className="text-sm text-gray-600 mb-2">{food.category || 'Recipe'}</p>
                                {food.ingredients && food.ingredients.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {food.ingredients.slice(0, 3).map((ingredient, idx) => (
                                      <span key={idx} className="text-xs bg-white px-2 py-1 rounded-full text-gray-600 border">
                                        {ingredient.name}
                                      </span>
                                    ))}
                                    {food.ingredients.length > 3 && (
                                      <span className="text-xs text-gray-500">+{food.ingredients.length - 3} more</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="bg-white rounded-xl p-3 shadow-sm border">
                                <p className="text-lg font-bold text-emerald-600">{food.calories || 0}</p>
                                <p className="text-xs text-gray-500 mb-2">calories</p>
                                <div className="text-xs text-gray-600 space-y-1">
                                  <div className="flex justify-between">
                                    <span>Protein:</span>
                                    <span className="font-medium">{food.protein || 0}g</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Carbs:</span>
                                    <span className="font-medium">{food.carbs || 0}g</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Fat:</span>
                                    <span className="font-medium">{food.fat || 0}g</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Enhanced Notes Section */}
                {selectedMeal.notes && selectedMeal.notes.length > 0 && (
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center mr-3">
                        <Leaf className="w-4 h-4 text-green-600" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-800">Ayurvedic Guidelines</h4>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                      <ul className="space-y-3">
                        {selectedMeal.notes.map((note, index) => (
                          <motion.li 
                            key={index} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start"
                          >
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                              <Leaf className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-sm text-gray-700 leading-relaxed">{note}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Enhanced Nutrition Summary */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-3">
                        <Zap className="w-5 h-5" />
                      </div>
                      <span className="text-xl font-bold">Nutrition Summary</span>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{selectedMeal?.calories || 0}</div>
                      <div className="text-emerald-100 text-sm">total calories</div>
                    </div>
                  </div>
                  {selectedMeal?.foods && selectedMeal.foods.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white/10 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold">
                          {selectedMeal.foods.reduce((sum, food) => sum + (food?.protein || 0), 0).toFixed(1)}
                        </div>
                        <div className="text-emerald-100 text-sm">Protein (g)</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold">
                          {selectedMeal.foods.reduce((sum, food) => sum + (food?.carbs || 0), 0).toFixed(1)}
                        </div>
                        <div className="text-emerald-100 text-sm">Carbs (g)</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold">
                          {selectedMeal.foods.reduce((sum, food) => sum + (food?.fat || 0), 0).toFixed(1)}
                        </div>
                        <div className="text-emerald-100 text-sm">Fat (g)</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Recipe Builder Modal */}
      {showRecipeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 overflow-hidden"
          >
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-health.dark">Build Recipe</h3>
              <button onClick={() => setShowRecipeModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-4">
                <input
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  placeholder="Recipe name (e.g., Moong Dal Khichdi)"
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <div>
                  <input
                    value={recipeSearch}
                    onChange={(e) => setRecipeSearch(e.target.value)}
                    placeholder="Search foods (e.g., rice, mung, ghee)"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg">
                    {(() => {
                      const results = recipeSearch ? (window.__food_search__ || null) : null;
                      return null;
                    })()}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-health.dark">Ingredients</p>
                  <div className="space-y-2">
                    {recipeItems.length === 0 && (
                      <p className="text-xs text-gray-500">No items yet. Add from the list.</p>
                    )}
                    {recipeItems.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-sm text-gray-700 flex-1">{it.food.name}</span>
                        <input
                          type="number"
                          min="0"
                          value={it.qty}
                          onChange={(e) => {
                            const v = Math.max(0, Number(e.target.value || 0));
                            setRecipeItems(prev => prev.map((p, i) => i === idx ? { ...p, qty: v } : p));
                          }}
                          className="w-24 px-2 py-1 border rounded"
                        />
                        <span className="text-xs text-gray-500">g</span>
                        <button
                          className="text-red-500 text-sm"
                          onClick={() => setRecipeItems(prev => prev.filter((_, i) => i !== idx))}
                        >Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Day</label>
                  <select value={recipeDay} onChange={(e) => setRecipeDay(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                    {daysList.map(d => (<option key={d} value={d}>{d}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Meal</label>
                  <select value={recipeMeal} onChange={(e) => setRecipeMeal(e.target.value)} className="w-full border rounded-lg px-3 py-2">
                    {mealTypes.map(m => (<option key={m.name} value={m.name}>{m.name}</option>))}
                  </select>
                </div>
                {(() => {
                  const totals = recipeItems.reduce((acc, it) => {
                    const scale = (it.qty || 0) / 100;
                    acc.calories += (it.food.calories || 0) * scale;
                    acc.protein += (it.food.protein || 0) * scale;
                    acc.carbs += (it.food.carbs || 0) * scale;
                    acc.fat += (it.food.fat || 0) * scale;
                    return acc;
                  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
                  return (
                    <div className="bg-gray-50 border rounded-lg p-3 text-sm">
                      <p className="text-health.dark font-medium mb-1">Totals</p>
                      <p className="text-gray-700">Calories: {Math.round(totals.calories)}</p>
                      <p className="text-gray-700">Protein: {totals.protein.toFixed(1)}g</p>
                      <p className="text-gray-700">Carbs: {totals.carbs.toFixed(1)}g</p>
                      <p className="text-gray-700">Fat: {totals.fat.toFixed(1)}g</p>
                    </div>
                  );
                })()}
                <button
                  disabled={recipeItems.length === 0}
                  onClick={() => {
                    // compute totals
                    const totals = recipeItems.reduce((acc, it) => {
                      const scale = (it.qty || 0) / 100;
                      acc.calories += (it.food.calories || 0) * scale;
                      acc.protein += (it.food.protein || 0) * scale;
                      acc.carbs += (it.food.carbs || 0) * scale;
                      acc.fat += (it.food.fat || 0) * scale;
                      return acc;
                    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
                    // patch plan
                    setDietPlan(prev => {
                      if (!prev) return prev;
                      const newPlan = { ...prev };
                      const meal = newPlan[recipeDay][recipeMeal];
                      meal.foods = [...meal.foods, {
                        name: recipeName || 'Custom Recipe',
                        category: 'Recipe',
                        calories: Math.round(totals.calories),
                        protein: Number(totals.protein.toFixed(1)),
                        carbs: Number(totals.carbs.toFixed(1)),
                        fat: Number(totals.fat.toFixed(1)),
                        image: 'https://images.unsplash.com/photo-1604908176997-4319bb963862?w=300&h=200&fit=crop'
                      }];
                      meal.calories = (meal.calories || 0) + Math.round(totals.calories);
                      return { ...newPlan };
                    });
                    setShowRecipeModal(false);
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-ayurvedic.green text-white hover:bg-green-600 disabled:opacity-50"
                >
                  Add to Plan
                </button>
              </div>
            </div>
            {/* Food search results (basic) */}
            <div className="px-5 pb-5">
              <p className="text-xs text-gray-500 mb-2">Suggestions</p>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  // Use simple suggestions: pick foods compatible with the selected dosha
                  const suggestions = getFoodsByDosha(selectedDosha).slice(0, 12);
                  return suggestions.map((f, i) => (
                    <button
                      key={`${f.id}-${i}`}
                      className="px-2 py-1 text-xs border rounded-full hover:border-ayurvedic.green"
                      onClick={() => {
                        setRecipeItems(prev => [...prev, { food: f, qty: 100 }]);
                      }}
                    >
                      {f.name}
                    </button>
                  ));
                })()}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DietGenerator;



