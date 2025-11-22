import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Loader, Calendar, Utensils } from 'lucide-react';

const DietPlanDetail = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({ 
    mealIndex: 0, 
    name: '', 
    quantity: '', 
    calories: '', 
    protein: '', 
    carbs: '', 
    fat: '', 
    fiber: '', 
    notes: '' 
  });

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/diet-plans', { params: { patientId } });
      const latest = data?.dietPlans?.[0] || null;
      setPlan(latest);
    } catch (err) {
      console.error('Error loading diet plan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchPlan();
      const params = new URLSearchParams(location.search);
      const fast = params.get('fast');
      if (fast === '1') {
        await generateFastPlan();
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, location.search]);

  const onChangeAdd = (e) => {
    const { name, value } = e.target;
    setAddForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddFood = async (e) => {
    e.preventDefault();
    if (!plan) return;
    const { mealIndex, name, quantity, calories, protein, carbs, fat, fiber, notes } = addForm;
    try {
      setAdding(true);
      const { data } = await axios.post(`/api/diet-plans/${plan._id}/meals/${mealIndex}/foods`, {
        name,
        calories: calories ? Number(calories) : undefined,
        protein: protein ? Number(protein) : undefined,
        carbs: carbs ? Number(carbs) : undefined,
        fat: fat ? Number(fat) : undefined,
        fiber: fiber ? Number(fiber) : undefined,
      notes
    });
    // refresh plan from server or patch locally
    const newPlan = { ...plan };
      newPlan.meals[mealIndex] = data.meal;
      setPlan(newPlan);
      setAddForm(prev => ({ 
        ...prev, 
        name: '', 
        quantity: '', 
        calories: '', 
        protein: '', 
        carbs: '', 
        fat: '', 
        fiber: '', 
        notes: '' 
      }));
    } catch (err) {
      console.error('Error adding food:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteFood = async (mealIndex, foodIndex) => {
    if (!plan) return;
    try {
      await axios.delete(`/api/diet-plans/${plan._id}/meals/${mealIndex}/foods/${foodIndex}`);
      const newPlan = { ...plan };
      newPlan.meals[mealIndex].foods.splice(foodIndex, 1);
      setPlan(newPlan);
    } catch (err) {
      console.error('Error removing food:', err);
    }
  };

  const generateFastPlan = async () => {
    try {
      let payload = null;
      if (plan) {
        payload = {
          patientId,
          dosha: plan.dosha,
          healthConditions: plan.restrictions || [],
          goals: plan.goals || ['Balance doshas'],
          duration: 7,
          fast: true
        };
      } else {
        // Fetch patient to derive dosha/conditions
        const { data: patient } = await axios.get(`/api/patients/${patientId}`);
        const dosha = patient?.healthProfile?.prakriti || 'Vata';
        const conditions = Array.isArray(patient?.healthProfile?.healthConditions)
          ? patient.healthProfile.healthConditions.map(c => c.name).filter(Boolean)
          : [];
        payload = {
          patientId,
          dosha,
          healthConditions: conditions,
          goals: ['Balance doshas'],
          duration: 7,
          fast: true
        };
      }
      await axios.post('/api/diet-plans/generate', payload);
      fetchPlan();
    } catch (err) {
      console.error('Error generating plan:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-5 h-5 animate-spin text-ayurvedic.green" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-emerald-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)} 
            className="flex items-center px-4 py-2 text-gray-600 hover:text-emerald-600 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-emerald-300"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
          </motion.button>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Diet Plan Details
              </h1>
              <p className="text-sm text-gray-600">Patient Nutrition Management</p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={generateFastPlan} 
              className="px-6 py-3 text-sm rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              <Plus className="w-4 h-4 mr-2 inline" />
              Regenerate Plan
            </motion.button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!plan ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-12 text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Utensils className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">No Diet Plan Found</h3>
            <p className="text-gray-600 text-lg mb-6">This patient doesn't have a diet plan yet.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={generateFastPlan}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg"
            >
              Generate New Plan
            </motion.button>
          </motion.div>
        ) : (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div className="mb-4 md:mb-0">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                        <Utensils className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold">{plan.name}</h2>
                        <p className="text-emerald-100">Constitution: <span className="font-semibold">{plan.dosha}</span></p>
                      </div>
                    </div>
                    {Array.isArray(plan.restrictions) && plan.restrictions.length > 0 && (
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                        <p className="text-emerald-100 text-sm">
                          <strong>Health Considerations:</strong> {plan.restrictions.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/30">
                    <Calendar className="w-5 h-5 mr-2" />
                    <span className="font-medium">{plan.duration} Day Plan</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 mb-8"
            >
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mr-4">
                  <Plus className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Add Food to Meal</h3>
              </div>
              <form onSubmit={handleAddFood} className="space-y-6">
                {/* First Row - Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Meal</label>
                    <select 
                      name="mealIndex" 
                      value={addForm.mealIndex} 
                      onChange={onChangeAdd} 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all duration-200"
                    >
                      {plan.meals.map((m, idx) => (
                        <option key={idx} value={idx}>{m.day} - {m.mealType}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Food Name</label>
                    <input 
                      name="name" 
                      value={addForm.name} 
                      onChange={onChangeAdd} 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all duration-200" 
                      placeholder="e.g., Brown rice" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <input 
                      name="quantity" 
                      value={addForm.quantity} 
                      onChange={onChangeAdd} 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all duration-200" 
                      placeholder="1 cup" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <input 
                      name="notes" 
                      value={addForm.notes} 
                      onChange={onChangeAdd} 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all duration-200" 
                      placeholder="e.g., Complex carbs" 
                    />
                  </div>
                </div>

                {/* Second Row - Nutrition Values */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Calories</label>
                    <input 
                      name="calories" 
                      type="number"
                      value={addForm.calories} 
                      onChange={onChangeAdd} 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all duration-200" 
                      placeholder="220" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Protein (g)</label>
                    <input 
                      name="protein" 
                      type="number"
                      value={addForm.protein} 
                      onChange={onChangeAdd} 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all duration-200" 
                      placeholder="8" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Carbs (g)</label>
                    <input 
                      name="carbs" 
                      type="number"
                      value={addForm.carbs} 
                      onChange={onChangeAdd} 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all duration-200" 
                      placeholder="45" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fat (g)</label>
                    <input 
                      name="fat" 
                      type="number"
                      value={addForm.fat} 
                      onChange={onChangeAdd} 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all duration-200" 
                      placeholder="3" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fiber (g)</label>
                    <input 
                      name="fiber" 
                      type="number"
                      value={addForm.fiber} 
                      onChange={onChangeAdd} 
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all duration-200" 
                      placeholder="5" 
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={adding} 
                    className="inline-flex items-center px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2" /> 
                    {adding ? 'Adding...' : 'Add Food'}
                  </motion.button>
                </div>
              </form>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Day</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Meal</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Foods</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">Calories</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">Protein</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">Carbs</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">Fat</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {plan.meals.map((meal, mIdx) => {
                      const mealIcons = {
                        'Breakfast': '🌅',
                        'Mid-Morning Snack': '🍎',
                        'Lunch': '🍽️',
                        'Evening Snack': '☕',
                        'Dinner': '🌙'
                      };
                      const totalCalories = (meal.foods || []).reduce((sum, food) => sum + (food.calories || 0), 0);
                      const totalProtein = (meal.foods || []).reduce((sum, food) => sum + (food.protein || 0), 0);
                      const totalCarbs = (meal.foods || []).reduce((sum, food) => sum + (food.carbs || 0), 0);
                      const totalFat = (meal.foods || []).reduce((sum, food) => sum + (food.fat || 0), 0);
                      
                      return (
                        <React.Fragment key={`${meal.day}-${meal.mealType}-${mIdx}`}>
                          {(meal.foods || []).length === 0 ? (
                            <tr className="hover:bg-emerald-50/50 transition-colors">
                              <td className="px-6 py-4 font-medium text-gray-900">{meal.day}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <span className="mr-2">{mealIcons[meal.mealType] || '🍴'}</span>
                                  <span className="font-medium text-gray-700">{meal.mealType}</span>
                                </div>
                              </td>
                              <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 italic">
                                No foods added yet
                              </td>
                            </tr>
                          ) : (
                            meal.foods.map((food, fIdx) => (
                              <tr key={`${mIdx}-${fIdx}-${food.name}`} className="hover:bg-emerald-50/50 transition-colors">
                                {fIdx === 0 && (
                                  <>
                                    <td rowSpan={meal.foods.length} className="px-6 py-4 font-medium text-gray-900 border-r border-gray-200">
                                      {meal.day}
                                    </td>
                                    <td rowSpan={meal.foods.length} className="px-6 py-4 border-r border-gray-200">
                                      <div className="flex items-center">
                                        <span className="mr-2">{mealIcons[meal.mealType] || '🍴'}</span>
                                        <div>
                                          <div className="font-medium text-gray-700">{meal.mealType}</div>
                                          <div className="text-xs text-gray-500">{totalCalories} cal total</div>
                                        </div>
                                      </div>
                                    </td>
                                  </>
                                )}
                                <td className="px-6 py-3">
                                  <div>
                                    <div className="font-medium text-gray-900">{food.name}</div>
                                    {food.quantity && (
                                      <div className="text-xs text-gray-600">{food.quantity}</div>
                                    )}
                                    {food.notes && (
                                      <div className="text-xs text-gray-500 italic mt-1">{food.notes}</div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-3 text-center">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                    {food.calories || '-'}
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-center">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                    {food.protein ? `${food.protein}g` : '-'}
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-center">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                                    {food.carbs ? `${food.carbs}g` : '-'}
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-center">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                    {food.fat ? `${food.fat}g` : '-'}
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-center">
                                  <motion.button 
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleDeleteFood(mIdx, fIdx)} 
                                    className="inline-flex items-center justify-center w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 rounded-lg transition-colors"
                                    title="Delete food"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </motion.button>
                                </td>
                              </tr>
                            ))
                          )}
                          {meal.foods.length > 0 && (
                            <tr className="bg-gray-50 font-semibold">
                              <td colSpan="3" className="px-6 py-2 text-right text-sm text-gray-700">Meal Total:</td>
                              <td className="px-6 py-2 text-center text-emerald-700">{totalCalories}</td>
                              <td className="px-6 py-2 text-center text-blue-700">{totalProtein}g</td>
                              <td className="px-6 py-2 text-center text-orange-700">{totalCarbs}g</td>
                              <td className="px-6 py-2 text-center text-purple-700">{totalFat}g</td>
                              <td></td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default DietPlanDetail;
