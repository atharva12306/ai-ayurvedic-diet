import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Utensils,
  MapPin,
  Calendar,
  ArrowRight,
  User,
  CheckCircle
} from 'lucide-react';

const DietPreferences = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get parameters from URL (from chatbot)
  const searchParams = new URLSearchParams(location.search);
  const urlDosha = searchParams.get('dosha');
  const urlPatientName = searchParams.get('name') || '';
  const urlPatientEmail = searchParams.get('email') || '';
  const fromChatbot = searchParams.get('fromChatbot') === 'true';
  
  const [season, setSeason] = useState('All-Season');
  const [region, setRegion] = useState('Pan-India');
  const [calories, setCalories] = useState(1800);
  const [isGenerating, setIsGenerating] = useState(false);

  // Redirect if not coming from chatbot
  useEffect(() => {
    if (!fromChatbot || !urlDosha) {
      navigate('/chatbot');
      return;
    }
  }, [fromChatbot, urlDosha, navigate]);

  const handleGenerateDiet = () => {
    if (!season || !region) {
      return;
    }

    setIsGenerating(true);
    
    // Navigate to diet generator with all parameters
    const params = new URLSearchParams({
      dosha: urlDosha,
      season: season,
      region: region,
      name: urlPatientName,
      email: urlPatientEmail,
      fromChatbot: 'true',
      calories: String(calories || 1800)
    });
    
    navigate(`/diet-generator?${params.toString()}`);
  };

  const seasonOptions = [
    { 
      value: 'Summer', 
      label: 'Summer', 
      description: 'Cooling foods like cucumber, coconut water, melons',
      icon: '☀️',
      color: 'from-orange-400 to-red-500'
    },
    { 
      value: 'Winter', 
      label: 'Winter', 
      description: 'Warming spices like ginger, cinnamon, hot soups',
      icon: '❄️',
      color: 'from-blue-400 to-cyan-500'
    },
    { 
      value: 'Monsoon', 
      label: 'Monsoon', 
      description: 'Light, easily digestible foods to support immunity',
      icon: '🌧️',
      color: 'from-gray-400 to-blue-600'
    },
    { 
      value: 'Spring', 
      label: 'Spring', 
      description: 'Fresh, detoxifying foods to cleanse after winter',
      icon: '🌸',
      color: 'from-green-400 to-emerald-500'
    },
    { 
      value: 'Autumn', 
      label: 'Autumn', 
      description: 'Grounding foods to prepare for winter',
      icon: '🍂',
      color: 'from-yellow-400 to-orange-500'
    }
  ];

  const regionOptions = [
    { 
      value: 'North', 
      label: 'North India', 
      description: 'Wheat-based meals, dairy products, seasonal vegetables',
      icon: '🌾',
      color: 'from-amber-400 to-yellow-500'
    },
    { 
      value: 'South', 
      label: 'South India', 
      description: 'Rice preparations, coconut-based curries, fermented foods',
      icon: '🥥',
      color: 'from-green-400 to-teal-500'
    },
    { 
      value: 'East', 
      label: 'East India', 
      description: 'Rice-based meals, mustard oil, fish preparations',
      icon: '🍚',
      color: 'from-blue-400 to-indigo-500'
    },
    { 
      value: 'West', 
      label: 'West India', 
      description: 'Millet rotis, legume-based dishes, regional spices',
      icon: '🌾',
      color: 'from-purple-400 to-pink-500'
    }
  ];

  if (!fromChatbot || !urlDosha) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/chatbot')}
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
                  <h1 className="text-2xl font-bold text-gray-900">Diet Preferences</h1>
                  <p className="text-sm text-gray-600">Customize your {urlDosha} diet plan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Patient Info Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{urlPatientName}</h2>
              <p className="text-gray-600">{urlPatientEmail}</p>
              <div className="flex items-center mt-1">
                <CheckCircle className="w-4 h-4 text-emerald-500 mr-1" />
                <span className="text-sm text-emerald-600 font-medium">Prakriti: {urlDosha}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Season Selection */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="flex items-center mb-6">
            <Calendar className="w-6 h-6 text-emerald-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">Select Season</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {seasonOptions.map((option) => (
              <motion.div
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                  season === option.value
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300'
                }`}
                onClick={() => setSeason(option.value)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${option.color} flex items-center justify-center text-white text-lg`}>
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{option.label}</h3>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  </div>
                </div>
                {season === option.value && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Region Selection */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="flex items-center mb-6">
            <MapPin className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">Select Region</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {regionOptions.map((option) => (
              <motion.div
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                  region === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => setRegion(option.value)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${option.color} flex items-center justify-center text-white text-lg`}>
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{option.label}</h3>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                  </div>
                </div>
                {region === option.value && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Calories Input */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="flex items-center mb-4">
            <Utensils className="w-6 h-6 text-emerald-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-800">Daily Calories</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">Target Calories</label>
            <input
              type="number"
              min={1200}
              max={3200}
              step={50}
              value={calories}
              onChange={(e) => setCalories(Number(e.target.value) || 1800)}
              className="sm:col-span-2 w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
              placeholder="e.g. 1800"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">This adjusts the plan's daily energy target in the generator.</p>
        </motion.div>

        {/* Generate Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <button
            onClick={handleGenerateDiet}
            disabled={isGenerating || !season || !region}
            className={`inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all transform hover:scale-105 ${
              isGenerating || !season || !region ? 'opacity-70 cursor-not-allowed transform-none' : ''
            }`}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Diet Plan...
              </>
            ) : (
              <>
                <Utensils className="w-6 h-6 mr-3" />
                Generate {urlDosha} Diet Plan
                <ArrowRight className="w-6 h-6 ml-3" />
              </>
            )}
          </button>
          
          {(!season || !region) && (
            <p className="mt-4 text-sm text-gray-500">
              Please select both season and region to continue
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DietPreferences;
