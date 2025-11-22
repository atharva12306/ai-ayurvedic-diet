import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Send,
  Bot,
  User,
  AlertTriangle,
  Lightbulb,
  Heart,
  Leaf,
  Zap,
  X,
} from 'lucide-react';
import { usePatients } from '../contexts/PatientContext';
import { useNavigate } from 'react-router-dom';

const Chatbot = ({ onPatientUpdate }) => {
  const { selectedPatient } = usePatients();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Namaste! I\'m your Ayurvedic AI assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [userPreferences, setUserPreferences] = useState({
    region: null,
    season: null,
    dosha: null
  });
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Check if this is a dosha analysis result
      const isDoshaResult = (inputMessage.includes('Mapped to') || 
                            inputMessage.includes('Constitution:') ||
                            inputMessage.includes('Stable') ||
                            inputMessage.includes('resistant')) && 
                           (inputMessage.includes('Vata') || 
                            inputMessage.includes('Pitta') || 
                            inputMessage.includes('Kapha') ||
                            inputMessage.includes('Stable'));


      let botMessage;
      
      if (isDoshaResult && selectedPatient) {
        // Extract the dosha from the message - handle multiple formats
        let dosha = null;
        
        // Try "Mapped to" format
        let doshaMatch = inputMessage.match(/Mapped to\s+(Vata|Pitta|Kapha)/i);
        if (doshaMatch) {
          dosha = doshaMatch[1];
        } else {
          // Try "Constitution:" format
          doshaMatch = inputMessage.match(/Constitution:\s*(Vata|Pitta|Kapha|Vata-Pitta|Pitta-Kapha|Vata-Kapha)/i);
          if (doshaMatch) {
            dosha = doshaMatch[1];
          } else if (inputMessage.includes('Stable') || inputMessage.includes('resistant')) {
            // Handle "Stable, resistant to change" response
            dosha = 'Kapha'; // Map to Kapha as it represents stability
          }
        }
        
        if (dosha) {
          try {
            console.log('Updating patient with dosha:', dosha);
            console.log('Existing health profile:', selectedPatient.healthProfile);
            
            const updateData = {
              'healthProfile.prakriti': dosha
            };
            
            // Only include these fields if they exist to avoid overwriting with empty arrays
            if (selectedPatient.healthProfile?.healthConditions) {
              updateData['healthProfile.healthConditions'] = selectedPatient.healthProfile.healthConditions;
            }
            if (selectedPatient.healthProfile?.allergies) {
              updateData['healthProfile.allergies'] = selectedPatient.healthProfile.allergies;
            }
            if (selectedPatient.healthProfile?.medications) {
              updateData['healthProfile.medications'] = selectedPatient.healthProfile.medications;
            }
            
            console.log('Sending update data:', updateData);
            
            const response = await fetch(`/api/patients/${selectedPatient._id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify(updateData)
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              console.error('Patient update failed:', response.status, errorData);
              throw new Error(errorData.message || `Failed to update patient data (${response.status})`);
            }

            const data = await response.json();

            // Refresh the patient data
            if (onPatientUpdate) {
              onPatientUpdate({ 
                ...selectedPatient, 
                healthProfile: { 
                  prakriti: dosha 
                } 
              });
            }

            // Navigate directly to full diet customization page
            const patientName = selectedPatient?.name || '';
            const patientEmail = selectedPatient?.email || '';
            
            // Show completion message with next actions
            botMessage = {
              id: Date.now() + 1,
              type: 'bot',
              content: `✅ **Dosha Analysis Complete!**

I've successfully identified your Ayurvedic constitution as **${dosha}**.

🎯 **Next Steps:**
Please select your preferences for the personalized diet plan:
- 🌿 **Season**: Choose current season (Summer/Winter/Monsoon/Spring/Autumn)
- 🗺️ **Region**: Select your location (North/South/East/West India)
- 🍽️ **Dietary Preferences**: Vegetarian/Vegan/Jain options
- ⚠️ **Allergies**: Nuts/Dairy/Gluten considerations

Select one of the options below to continue.`,
              timestamp: new Date(),
              dosha: dosha,
              showNextActions: true
            };
            
          } catch (updateError) {
            console.error('Error updating patient data:', updateError);
            const patientName = selectedPatient?.name || '';
            const patientEmail = selectedPatient?.email || '';
            
            botMessage = {
              id: Date.now() + 1,
              type: 'bot',
              content: `❌ I identified your dosha as **${dosha}**, but encountered an error saving it.

Don't worry! The doctor can still create your personalized diet plan.

*Redirecting to diet customization...*`,
              timestamp: new Date(),
              dosha: dosha
            };
            
            // Still present actions for manual continuation
            console.log('⚠️ Error updating patient; presenting next-step buttons');
          }
          
          setMessages(prev => [...prev, botMessage]);
          setIsTyping(false);
          return;
        }
      }
      
      // Regular chatbot message handling
      const response = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: inputMessage,
          context: {
            selectedPatient: selectedPatient ? {
              id: selectedPatient._id,
              name: selectedPatient.name,
              age: selectedPatient.age,
              gender: selectedPatient.gender,
              prakriti: selectedPatient.healthProfile?.prakriti || null
            } : null
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      const data = await response.json();
      
      botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.response,
        suggestions: data.suggestions || [],
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'I understand your request. How can I assist you further?',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
  };

  const handleSuggestion = (suggestion) => {
    setInputMessage(suggestion);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        type: 'bot',
        content: 'Namaste! I\'m your Ayurvedic AI assistant. How can I help you today?',
        timestamp: new Date()
      }
    ]);
  };

  // Helper functions for diet plan descriptions
  const getDoshaDescription = (dosha, season) => {
    const descriptions = {
      'Vata': {
        'Summer': 'Warm, grounding foods with healthy oils to balance dryness',
        'Winter': 'Warming, nourishing foods with ghee and spices',
        'Monsoon': 'Light, warm, easily digestible foods',
        'Spring': 'Warm, detoxifying foods to cleanse accumulated toxins',
        'Autumn': 'Grounding, nourishing foods to prepare for winter'
      },
      'Pitta': {
        'Summer': 'Cooling, hydrating foods to reduce excess heat',
        'Winter': 'Moderately warming foods, avoiding excess heat',
        'Monsoon': 'Light, cooling foods that aid digestion',
        'Spring': 'Bitter, astringent foods for liver cleansing',
        'Autumn': 'Sweet, cooling foods to balance accumulated heat'
      },
      'Kapha': {
        'Summer': 'Light, dry foods with warming spices',
        'Winter': 'Warming, stimulating foods to counter sluggishness',
        'Monsoon': 'Light, warm, spiced foods to aid digestion',
        'Spring': 'Detoxifying, light foods to reduce accumulated mucus',
        'Autumn': 'Warming, light foods to prevent weight gain'
      }
    };
    return descriptions[dosha]?.[season] || 'Balanced foods appropriate for your constitution';
  };

  const getSeasonalDescription = (season) => {
    const descriptions = {
      'Summer': 'Cooling foods like cucumber, coconut water, and fresh fruits',
      'Winter': 'Warming foods like ginger, hot soups, and cooked grains',
      'Monsoon': 'Light, digestible foods with immunity-boosting spices',
      'Spring': 'Detoxifying foods like leafy greens and bitter vegetables',
      'Autumn': 'Grounding foods like root vegetables and warming spices'
    };
    return descriptions[season] || 'Seasonal foods appropriate for the climate';
  };

  const getRegionalDescription = (region) => {
    const descriptions = {
      'North': 'Wheat-based meals, dairy products, and seasonal vegetables',
      'South': 'Rice preparations, coconut-based curries, and fermented foods',
      'East': 'Rice-based meals, mustard oil preparations, and fish dishes',
      'West': 'Millet rotis, legume-based dishes, and regional spices'
    };
    return descriptions[region] || 'Traditional Indian foods';
  };

  const getBasicDietPlan = (dosha, season, region) => {
    const plans = {
      'Vata': {
        'Summer': {
          'North': '**Breakfast:** Warm milk with dates, Wheat porridge\n**Lunch:** Dal rice with ghee, Cooked vegetables\n**Dinner:** Khichdi with ghee, Warm milk',
          'South': '**Breakfast:** Idli with coconut chutney, Warm milk\n**Lunch:** Sambar rice with ghee, Cooked vegetables\n**Dinner:** Curd rice, Warm milk with turmeric',
          'East': '**Breakfast:** Rice porridge with milk, Banana\n**Lunch:** Dal rice with mustard oil, Fish curry\n**Dinner:** Khichdi, Warm milk',
          'West': '**Breakfast:** Bajra porridge with ghee, Dates\n**Lunch:** Dal rice, Cooked vegetables\n**Dinner:** Khichdi with ghee, Warm milk'
        }
      },
      'Pitta': {
        'Summer': {
          'North': '**Breakfast:** Fresh fruit, Coconut water\n**Lunch:** Curd rice, Cucumber raita\n**Dinner:** Light khichdi, Buttermilk',
          'South': '**Breakfast:** Coconut water, Fresh fruits\n**Lunch:** Curd rice, Coconut chutney\n**Dinner:** Light sambar rice, Buttermilk',
          'East': '**Breakfast:** Rice flakes with milk, Fresh fruits\n**Lunch:** Rice with cooling vegetables\n**Dinner:** Light rice preparation, Buttermilk',
          'West': '**Breakfast:** Fresh fruit juice, Light breakfast\n**Lunch:** Rice with cooling vegetables\n**Dinner:** Light khichdi, Buttermilk'
        }
      },
      'Kapha': {
        'Winter': {
          'North': '**Breakfast:** Ginger tea, Light breakfast\n**Lunch:** Spiced vegetables, Barley roti\n**Dinner:** Light soup, Herbal tea',
          'South': '**Breakfast:** Ginger tea, Steamed idli\n**Lunch:** Spiced sambar, Millet rice\n**Dinner:** Light rasam, Herbal tea',
          'East': '**Breakfast:** Ginger tea, Light rice preparation\n**Lunch:** Spiced fish curry, Brown rice\n**Dinner:** Light soup, Herbal tea',
          'West': '**Breakfast:** Ginger tea, Bajra roti\n**Lunch:** Spiced dal, Jowar roti\n**Dinner:** Light soup, Herbal tea'
        }
      }
    };
    
    return plans[dosha]?.[season]?.[region] || 
           `**Sample ${dosha} Plan for ${season}:**\n**Breakfast:** Light, appropriate foods\n**Lunch:** Balanced main meal\n**Dinner:** Light, easily digestible foods`;
  };

  const MessageBubble = ({ message }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`flex items-start ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
      >
        <div
          className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
            message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}
        >
          {message.type === 'user' ? <User size={16} /> : <Bot size={16} />}
        </div>
        <div
          className={`mx-2 px-4 py-2 rounded-lg ${
            message.type === 'user'
              ? 'bg-blue-500 text-white rounded-tr-none'
              : 'bg-gray-100 text-gray-800 rounded-tl-none'
          }`}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>
          {message.suggestions && message.suggestions.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestion(suggestion)}
                  className="block w-full text-left px-3 py-1 text-sm bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          {message.showNextActions && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const params = new URLSearchParams({
                    dosha: message.dosha || selectedPatient?.healthProfile?.prakriti || '',
                    fromChatbot: 'true',
                    name: selectedPatient?.name || '',
                    email: selectedPatient?.email || ''
                  });
                  navigate(`/diet-preferences?${params.toString()}`);
                }}
                className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
              >
                Diet Preferences
              </button>
              <button
                onClick={() => {
                  const params = new URLSearchParams({
                    dosha: message.dosha || selectedPatient?.healthProfile?.prakriti || '',
                    season: 'All-Season',
                    region: 'Pan-India',
                    fromChatbot: 'true',
                    autoGenerate: 'true',
                    name: selectedPatient?.name || '',
                    email: selectedPatient?.email || ''
                  });
                  navigate(`/diet-generator?${params.toString()}`);
                }}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Generate Diet Now
              </button>
            </div>
          )}
          {message.showRegionSeasonButtons && (
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-xs font-semibold mb-2">🗺️ Select Your Region:</p>
                <div className="flex flex-wrap gap-1">
                  {['North India', 'South India', 'East India', 'West India'].map((region) => (
                    <button
                      key={region}
                      onClick={() => setInputMessage(`I'm from ${region}`)}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition"
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-2">🌿 Select Current Season:</p>
                <div className="flex flex-wrap gap-1">
                  {['Summer', 'Winter', 'Monsoon', 'Spring', 'Autumn'].map((season) => (
                    <button
                      key={season}
                      onClick={() => setInputMessage(`It's ${season} season`)}
                      className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition"
                    >
                      {season}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-gray-600">💡 Or type: "I'm from South India and it's Summer"</p>
              </div>
            </div>
          )}
          {message.showDietActions && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => handleSuggestion('Save this diet plan')}
                className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition"
              >
                💾 Save Plan
              </button>
              <button
                onClick={() => handleSuggestion('Generate different diet plan')}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                🔄 New Plan
              </button>
              <button
                onClick={() => {
                  const params = new URLSearchParams({
                    dosha: selectedPatient?.healthProfile?.prakriti || '',
                    fromChatbot: 'true',
                    name: selectedPatient?.name || '',
                    email: selectedPatient?.email || ''
                  });
                  navigate(`/diet-preferences?${params.toString()}`);
                }}
                className="px-3 py-1 text-sm bg-emerald-500 text-white rounded hover:bg-emerald-600 transition"
              >
                📱 View Full Plan
              </button>
            </div>
          )}
          <div className="text-xs mt-1 opacity-70">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <motion.button
          onClick={() => setIsMinimized(false)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-blue-500 text-white p-3 rounded-full shadow-lg"
        >
          <MessageCircle size={24} />
        </motion.button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl flex flex-col z-50">
      <div className="bg-blue-500 text-white p-4 rounded-t-lg flex justify-between items-center">
        <h3 className="font-semibold">Ayurvedic Assistant</h3>
        <button
          onClick={() => setIsMinimized(true)}
          className="text-white hover:text-gray-200"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto max-h-96">
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </AnimatePresence>
        {isTyping && (
          <div className="flex items-center space-x-2 p-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="p-2 text-white bg-blue-500 rounded-lg disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
        
        {showDisclaimer && (
          <div className="mt-2 text-xs text-gray-500">
            <p>Note: This is an AI assistant. For medical advice, please consult a qualified healthcare professional.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chatbot;

