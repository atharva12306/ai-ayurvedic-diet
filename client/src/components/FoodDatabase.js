import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Star, 
  Clock, 
  Thermometer,
  Scale,
  Zap,
  Leaf,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useFood } from '../contexts/FoodContext';

const FoodDatabase = () => {
  const { 
    foods, 
    searchFoods, 
    getFoodById, 
    getTasteCategories, 
    getFoodCategories 
  } = useFood();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    taste: '',
    category: '',
    dosha: '',
    digestibility: '',
    temperature: ''
  });
  const [viewMode, setViewMode] = useState('grid');
  const [selectedFood, setSelectedFood] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('name');

  const tasteCategories = getTasteCategories();
  const foodCategories = getFoodCategories();
  const digestibilityOptions = ['Light', 'Medium', 'Heavy'];
  const temperatureOptions = ['Hot', 'Warm', 'Cold', 'Cooling'];
  const doshaOptions = ['Vata', 'Pitta', 'Kapha'];

  const filteredFoods = searchFoods(searchQuery, filters);

  const sortedFoods = [...filteredFoods].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'calories':
        return b.calories - a.calories;
      case 'protein':
        return b.protein - a.protein;
      default:
        return 0;
    }
  });

  const getTasteColor = (taste) => {
    switch (taste) {
      case 'Sweet': return 'taste-sweet';
      case 'Sour': return 'taste-sour';
      case 'Salty': return 'taste-salty';
      case 'Pungent': return 'taste-pungent';
      case 'Bitter': return 'taste-bitter';
      case 'Astringent': return 'taste-astringent';
      default: return 'text-gray-600';
    }
  };

  const getDoshaCompatibilityColor = (compatibility) => {
    switch (compatibility) {
      case 'Excellent': return 'text-green-600 bg-green-100';
      case 'Good': return 'text-blue-600 bg-blue-100';
      case 'Moderate': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDigestibilityColor = (digestibility) => {
    switch (digestibility) {
      case 'Light': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'Heavy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTemperatureColor = (temperature) => {
    switch (temperature) {
      case 'Hot': return 'text-red-600';
      case 'Warm': return 'text-orange-600';
      case 'Cold': return 'text-blue-600';
      case 'Cooling': return 'text-cyan-600';
      default: return 'text-gray-600';
    }
  };

  const clearFilters = () => {
    setFilters({
      taste: '',
      category: '',
      dosha: '',
      digestibility: '',
      temperature: ''
    });
    setSearchQuery('');
  };

  const FoodCard = ({ food }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200"
      onClick={() => setSelectedFood(food)}
    >
      <div className="relative">
        <img
          src={food.image}
          alt={food.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTasteColor(food.taste)}`}>
            {food.taste}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-health.dark mb-2">{food.name}</h3>
        <p className="text-sm text-gray-600 mb-3">{food.category}</p>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Calories:</span>
            <span className="font-medium">{food.calories}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Protein:</span>
            <span className="font-medium">{food.protein}g</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Digestibility:</span>
            <span className={`font-medium ${getDigestibilityColor(food.digestibility)}`}>
              {food.digestibility}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-1">
            {Object.entries(food.doshaCompatibility).map(([dosha, compatibility]) => (
              <span
                key={dosha}
                className={`px-2 py-1 rounded text-xs ${getDoshaCompatibilityColor(compatibility)}`}
              >
                {dosha}: {compatibility}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const FoodListItem = ({ food }) => (
    <motion.div
      whileHover={{ backgroundColor: '#f8fafc' }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-all duration-200"
      onClick={() => setSelectedFood(food)}
    >
      <div className="flex items-center space-x-4">
        <img
          src={food.image}
          alt={food.name}
          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-health.dark truncate">{food.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTasteColor(food.taste)}`}>
              {food.taste}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-2">{food.category}</p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{food.calories} cal</span>
            <span>P: {food.protein}g</span>
            <span>C: {food.carbs}g</span>
            <span>F: {food.fat}g</span>
            <span className={getDigestibilityColor(food.digestibility)}>
              {food.digestibility}
            </span>
            <span className={getTemperatureColor(food.temperature)}>
              {food.temperature}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col space-y-1">
          {Object.entries(food.doshaCompatibility).map(([dosha, compatibility]) => (
            <span
              key={dosha}
              className={`px-2 py-1 rounded text-xs text-center ${getDoshaCompatibilityColor(compatibility)}`}
            >
              {dosha}: {compatibility}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-health.light">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Search className="h-8 w-8 text-ayurvedic.green mr-3" />
              <h1 className="text-2xl font-bold text-health.dark">Food Database</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-ayurvedic.green text-white' : 'text-gray-600 hover:text-ayurvedic.green'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-ayurvedic.green text-white' : 'text-gray-600 hover:text-ayurvedic.green'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search foods, categories, or descriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ayurvedic.green focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:border-ayurvedic.green transition-colors"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
            </button>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ayurvedic.green focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="calories">Sort by Calories</option>
              <option value="protein">Sort by Protein</option>
            </select>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Taste Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Taste</label>
                  <select
                    value={filters.taste}
                    onChange={(e) => setFilters({ ...filters, taste: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ayurvedic.green focus:border-transparent"
                  >
                    <option value="">All Tastes</option>
                    {tasteCategories.map(taste => (
                      <option key={taste} value={taste}>{taste}</option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ayurvedic.green focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {foodCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Dosha Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dosha</label>
                  <select
                    value={filters.dosha}
                    onChange={(e) => setFilters({ ...filters, dosha: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ayurvedic.green focus:border-transparent"
                  >
                    <option value="">All Doshas</option>
                    {doshaOptions.map(dosha => (
                      <option key={dosha} value={dosha}>{dosha}</option>
                    ))}
                  </select>
                </div>

                {/* Digestibility Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Digestibility</label>
                  <select
                    value={filters.digestibility}
                    onChange={(e) => setFilters({ ...filters, digestibility: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ayurvedic.green focus:border-transparent"
                  >
                    <option value="">All</option>
                    {digestibilityOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                {/* Temperature Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Temperature</label>
                  <select
                    value={filters.temperature}
                    onChange={(e) => setFilters({ ...filters, temperature: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ayurvedic.green focus:border-transparent"
                  >
                    <option value="">All</option>
                    {temperatureOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-ayurvedic.green border border-gray-300 rounded-lg hover:border-ayurvedic.green transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            Showing {sortedFoods.length} of {foods.length} foods
          </p>
        </div>

        {/* Food Grid/List */}
        {sortedFoods.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
          }>
            {sortedFoods.map((food) => (
              viewMode === 'grid' ? (
                <FoodCard key={food.id} food={food} />
              ) : (
                <FoodListItem key={food.id} food={food} />
              )
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No foods found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Food Detail Modal */}
      {selectedFood && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto modal-content"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-start space-x-4">
                  <img
                    src={selectedFood.image}
                    alt={selectedFood.name}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div>
                    <h2 className="text-2xl font-bold text-health.dark mb-2">{selectedFood.name}</h2>
                    <p className="text-gray-600 mb-2">{selectedFood.category}</p>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTasteColor(selectedFood.taste)}`}>
                        {selectedFood.taste}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDigestibilityColor(selectedFood.digestibility)}`}>
                        {selectedFood.digestibility}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTemperatureColor(selectedFood.temperature)}`}>
                        {selectedFood.temperature}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFood(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Nutritional Information */}
                <div>
                  <h3 className="text-lg font-semibold text-health.dark mb-4">Nutritional Information</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Calories</span>
                      <span className="font-semibold text-lg">{selectedFood.calories}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Protein</span>
                      <span className="font-semibold">{selectedFood.protein}g</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Carbohydrates</span>
                      <span className="font-semibold">{selectedFood.carbs}g</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Fat</span>
                      <span className="font-semibold">{selectedFood.fat}g</span>
                    </div>
                  </div>

                  {/* Dosha Compatibility */}
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-health.dark mb-3">Dosha Compatibility</h4>
                    <div className="space-y-2">
                      {Object.entries(selectedFood.doshaCompatibility).map(([dosha, compatibility]) => (
                        <div key={dosha} className="flex justify-between items-center">
                          <span className="text-gray-600">{dosha}</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDoshaCompatibilityColor(compatibility)}`}>
                            {compatibility}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description and Benefits */}
                <div>
                  <h3 className="text-lg font-semibold text-health.dark mb-4">Description</h3>
                  <p className="text-gray-700 mb-6">{selectedFood.description}</p>

                  <h4 className="text-lg font-semibold text-health.dark mb-3">Benefits</h4>
                  <ul className="space-y-2 mb-6">
                    {selectedFood.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <Leaf className="w-4 h-4 text-ayurvedic.green mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <h4 className="text-lg font-semibold text-health.dark mb-3">Preparation Tips</h4>
                  <p className="text-gray-700">{selectedFood.preparation}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FoodDatabase;






