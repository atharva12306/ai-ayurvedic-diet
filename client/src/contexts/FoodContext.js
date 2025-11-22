import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const FoodContext = createContext();

export const useFood = () => {
  const context = useContext(FoodContext);
  if (!context) {
    throw new Error('useFood must be used within a FoodProvider');
  }
  return context;
};

export const FoodProvider = ({ children }) => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sample food database for development
  const sampleFoods = [
    {
      id: 1,
      name: 'Basmati Rice',
      category: 'Grains',
      taste: 'Sweet',
      calories: 130,
      protein: 2.7,
      carbs: 28,
      fat: 0.3,
      digestibility: 'Medium',
      temperature: 'Warm',
      doshaCompatibility: {
        vata: 'Good',
        pitta: 'Good',
        kapha: 'Moderate'
      },
      description: 'Aromatic long-grain rice, excellent for all doshas when properly prepared',
      benefits: ['Easy to digest', 'Provides energy', 'Balances all doshas'],
      preparation: 'Wash and soak for 30 minutes before cooking',
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=200&fit=crop'
    },
    {
      id: 2,
      name: 'Ghee (Clarified Butter)',
      category: 'Dairy',
      taste: 'Sweet',
      calories: 900,
      protein: 0,
      carbs: 0,
      fat: 100,
      digestibility: 'Light',
      temperature: 'Hot',
      doshaCompatibility: {
        vata: 'Excellent',
        pitta: 'Good',
        kapha: 'Moderate'
      },
      description: 'Pure clarified butter, considered the best cooking medium in Ayurveda',
      benefits: ['Enhances digestion', 'Nourishes tissues', 'Increases ojas'],
      preparation: 'Use in moderation, best when fresh and organic',
      image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=200&fit=crop'
    },
    {
      id: 3,
      name: 'Turmeric',
      category: 'Spices',
      taste: 'Bitter',
      calories: 354,
      protein: 7.8,
      carbs: 64.9,
      fat: 9.9,
      digestibility: 'Light',
      temperature: 'Hot',
      doshaCompatibility: {
        vata: 'Good',
        pitta: 'Good',
        kapha: 'Excellent'
      },
      description: 'Golden spice with powerful anti-inflammatory properties',
      benefits: ['Anti-inflammatory', 'Antioxidant', 'Supports liver function'],
      preparation: 'Best consumed with black pepper and fat for absorption',
      image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&h=200&fit=crop'
    },
    {
      id: 4,
      name: 'Mung Beans',
      category: 'Legumes',
      taste: 'Sweet',
      calories: 347,
      protein: 24,
      carbs: 63,
      fat: 1.2,
      digestibility: 'Light',
      temperature: 'Cooling',
      doshaCompatibility: {
        vata: 'Good',
        pitta: 'Excellent',
        kapha: 'Good'
      },
      description: 'Easily digestible beans, perfect for cleansing and detoxification',
      benefits: ['High protein', 'Easy to digest', 'Detoxifying'],
      preparation: 'Soak overnight, cook until soft, add digestive spices',
      image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&h=200&fit=crop'
    },
    {
      id: 5,
      name: 'Ginger',
      category: 'Spices',
      taste: 'Pungent',
      calories: 80,
      protein: 1.8,
      carbs: 17.8,
      fat: 0.8,
      digestibility: 'Light',
      temperature: 'Hot',
      doshaCompatibility: {
        vata: 'Excellent',
        pitta: 'Moderate',
        kapha: 'Excellent'
      },
      description: 'Powerful digestive spice that ignites agni (digestive fire)',
      benefits: ['Improves digestion', 'Reduces nausea', 'Warms the body'],
      preparation: 'Use fresh or dried, add to cooking or make tea',
      image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=200&fit=crop'
    },
    {
      id: 6,
      name: 'Coconut',
      category: 'Fruits',
      taste: 'Sweet',
      calories: 354,
      protein: 3.3,
      carbs: 15.2,
      fat: 33.5,
      digestibility: 'Heavy',
      temperature: 'Cooling',
      doshaCompatibility: {
        vata: 'Good',
        pitta: 'Excellent',
        kapha: 'Moderate'
      },
      description: 'Cooling fruit that balances pitta and provides healthy fats',
      benefits: ['Cooling effect', 'Healthy fats', 'Hydrating'],
      preparation: 'Use fresh coconut water and meat, avoid processed forms',
      image: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=300&h=200&fit=crop'
    },
    {
      id: 7,
      name: 'Cumin Seeds',
      category: 'Spices',
      taste: 'Pungent',
      calories: 375,
      protein: 17.8,
      carbs: 44.2,
      fat: 22.3,
      digestibility: 'Light',
      temperature: 'Hot',
      doshaCompatibility: {
        vata: 'Good',
        pitta: 'Good',
        kapha: 'Excellent'
      },
      description: 'Essential digestive spice that improves agni and reduces gas',
      benefits: ['Improves digestion', 'Reduces bloating', 'Enhances flavor'],
      preparation: 'Dry roast before use, add to tempering or directly to dishes',
      image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&h=200&fit=crop'
    },
    {
      id: 8,
      name: 'Dates',
      category: 'Fruits',
      taste: 'Sweet',
      calories: 277,
      protein: 1.8,
      carbs: 75,
      fat: 0.2,
      digestibility: 'Heavy',
      temperature: 'Warm',
      doshaCompatibility: {
        vata: 'Excellent',
        pitta: 'Moderate',
        kapha: 'Moderate'
      },
      description: 'Natural sweetener that nourishes and provides quick energy',
      benefits: ['Natural sweetness', 'High energy', 'Nourishing'],
      preparation: 'Soak in water before eating, use as natural sweetener',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop'
    }
  ];

  useEffect(() => {
    // Load sample data for development
    setFoods(sampleFoods);
  }, []);

  const searchFoods = (query, filters = {}) => {
    let filteredFoods = [...foods];

    if (query) {
      filteredFoods = filteredFoods.filter(food =>
        food.name.toLowerCase().includes(query.toLowerCase()) ||
        food.category.toLowerCase().includes(query.toLowerCase()) ||
        food.description.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (filters.taste) {
      filteredFoods = filteredFoods.filter(food => food.taste === filters.taste);
    }

    if (filters.category) {
      filteredFoods = filteredFoods.filter(food => food.category === filters.category);
    }

    if (filters.dosha) {
      filteredFoods = filteredFoods.filter(food => 
        food.doshaCompatibility[filters.dosha.toLowerCase()] === 'Excellent' ||
        food.doshaCompatibility[filters.dosha.toLowerCase()] === 'Good'
      );
    }

    if (filters.digestibility) {
      filteredFoods = filteredFoods.filter(food => food.digestibility === filters.digestibility);
    }

    if (filters.temperature) {
      filteredFoods = filteredFoods.filter(food => food.temperature === filters.temperature);
    }

    return filteredFoods;
  };

  const getFoodById = (id) => {
    return foods.find(food => food.id === id);
  };

  const getFoodsByDosha = (dosha) => {
    return foods.filter(food => 
      food.doshaCompatibility[dosha.toLowerCase()] === 'Excellent' ||
      food.doshaCompatibility[dosha.toLowerCase()] === 'Good'
    );
  };

  const getTasteCategories = () => {
    return ['Sweet', 'Sour', 'Salty', 'Pungent', 'Bitter', 'Astringent'];
  };

  const getFoodCategories = () => {
    const categories = [...new Set(foods.map(food => food.category))];
    return categories.sort();
  };

  const value = {
    foods,
    searchFoods,
    getFoodById,
    getFoodsByDosha,
    getTasteCategories,
    getFoodCategories,
    loading
  };

  return (
    <FoodContext.Provider value={value}>
      {children}
    </FoodContext.Provider>
  );
};






