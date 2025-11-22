const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/chatbot/message
// @desc    Process chatbot message and get AI response
// @access  Private
router.post('/message', auth, [
  body('message').trim().isLength({ min: 1 }).withMessage('Message is required'),
  body('context').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { message, context = {} } = req.body;
    const { selectedPatient } = context;

    // Generate AI response based on message content
    const response = await generateAIResponse(message, selectedPatient);

    res.json({
      response: response.content,
      suggestions: response.suggestions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chatbot message error:', error);
    res.status(500).json({ message: 'Server error while processing message' });
  }
});

// @route   GET /api/chatbot/suggestions
// @desc    Get quick question suggestions
// @access  Private
router.get('/suggestions', auth, async (req, res) => {
  try {
    const suggestions = [
      'What foods are good for Vata dosha?',
      'How to balance Pitta dosha?',
      'What are the benefits of turmeric?',
      'How to improve digestion?',
      'What should I eat for breakfast?',
      'How to reduce inflammation naturally?',
      'What spices help with Kapha dosha?',
      'How to prepare golden milk?',
      'What are the six tastes in Ayurveda?',
      'How to follow a Sattvic diet?'
    ];

    res.json(suggestions);
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ message: 'Server error while fetching suggestions' });
  }
});

// @route   POST /api/chatbot/feedback
// @desc    Submit feedback for chatbot responses
// @access  Private
router.post('/feedback', auth, [
  body('messageId').optional().isString(),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { messageId, rating, feedback } = req.body;

    // In a real application, you would save this feedback to a database
    console.log('Chatbot feedback:', { messageId, rating, feedback, userId: req.userId });

    res.json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ message: 'Server error while submitting feedback' });
  }
});

// @route   POST /api/chatbot/patient-registration
// @desc    Process patient registration with AI assistance
// @access  Private
router.post('/patient-registration', auth, [
  body('step').isString().withMessage('Step is required'),
  body('userInput').isString().withMessage('User input is required'),
  body('patientData').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { step, userInput, patientData = {} } = req.body;

    // Generate contextual response based on registration step
    const response = await generatePatientRegistrationResponse(step, userInput, patientData);

    res.json({
      response: response.content,
      nextStep: response.nextStep,
      suggestions: response.suggestions,
      validationErrors: response.validationErrors || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Patient registration chatbot error:', error);
    res.status(500).json({ message: 'Server error while processing patient registration' });
  }
});

// Helper function to generate AI responses
async function generateAIResponse(message, selectedPatient = null) {
  const lowerMessage = message.toLowerCase();
  
  // Context-aware responses
  let contextInfo = '';
  if (selectedPatient) {
    contextInfo = `Patient: ${selectedPatient.name}, Dosha: ${selectedPatient.prakriti}. `;
  }

  // Keyword-based response generation
  if (lowerMessage.includes('vata') || lowerMessage.includes('vata dosha')) {
    return {
      content: `${contextInfo}For Vata dosha, focus on warm, cooked, and grounding foods:\n\n• Warm, cooked grains like rice and quinoa\n• Root vegetables like sweet potatoes and carrots\n• Healthy fats like ghee and olive oil\n• Warm spices like ginger, cinnamon, and cardamom\n• Cooked fruits and warm beverages\n\nAvoid cold, raw foods and excessive caffeine.`,
      suggestions: ['Vata-pacifying recipes', 'Best spices for Vata', 'Vata lifestyle tips', 'Vata breakfast ideas']
    };
  } else if (lowerMessage.includes('pitta') || lowerMessage.includes('pitta dosha')) {
    return {
      content: `${contextInfo}To balance Pitta dosha, choose cooling and calming foods:\n\n• Sweet, bitter, and astringent tastes\n• Cooling vegetables like cucumber and leafy greens\n• Sweet fruits like melons and grapes\n• Dairy products like milk and ghee\n• Cooling herbs like mint and coriander\n\nAvoid spicy, sour, and salty foods that can aggravate Pitta.`,
      suggestions: ['Pitta-pacifying recipes', 'Cooling foods list', 'Pitta lifestyle tips', 'Summer diet for Pitta']
    };
  } else if (lowerMessage.includes('kapha') || lowerMessage.includes('kapha dosha')) {
    return {
      content: `${contextInfo}For Kapha dosha, choose light, warm, and stimulating foods:\n\n• Light, dry grains like barley and quinoa\n• Pungent, bitter, and astringent tastes\n• Warming spices like ginger, black pepper, and cayenne\n• Light, cooked vegetables\n• Warm beverages and herbal teas\n\nAvoid heavy, oily, and cold foods that can increase Kapha.`,
      suggestions: ['Kapha-pacifying recipes', 'Light foods for Kapha', 'Kapha lifestyle tips', 'Weight management for Kapha']
    };
  } else if (lowerMessage.includes('turmeric') || lowerMessage.includes('curcumin')) {
    return {
      content: `${contextInfo}Turmeric is a powerful Ayurvedic herb with numerous benefits:\n\n• Anti-inflammatory properties\n• Supports liver function\n• Aids digestion\n• Boosts immunity\n• Natural antioxidant\n\nBest consumed with black pepper and healthy fats for better absorption. Use in cooking or as golden milk.`,
      suggestions: ['Golden milk recipe', 'Turmeric supplements', 'Turmeric in cooking', 'Turmeric face mask']
    };
  } else if (lowerMessage.includes('digestion') || lowerMessage.includes('digestive')) {
    return {
      content: `${contextInfo}To improve digestion naturally:\n\n• Eat at regular times\n• Include digestive spices like ginger, cumin, and fennel\n• Drink warm water throughout the day\n• Practice mindful eating\n• Include fiber-rich foods\n• Avoid overeating and cold drinks with meals\n\nTry ginger tea or triphala for digestive support.`,
      suggestions: ['Digestive tea recipes', 'Best digestive spices', 'Meal timing tips', 'Agni strengthening foods']
    };
  } else if (lowerMessage.includes('breakfast') || lowerMessage.includes('morning meal')) {
    return {
      content: `${contextInfo}For a healthy Ayurvedic breakfast:\n\n• Warm, cooked foods are ideal\n• Include grains like oatmeal or rice\n• Add warming spices like cinnamon and cardamom\n• Include healthy fats like ghee or nuts\n• Avoid cold, raw foods in the morning\n• Eat within 2 hours of waking up\n\nConsider porridge, warm fruit, or cooked grains with spices.`,
      suggestions: ['Ayurvedic breakfast recipes', 'Morning routine tips', 'Best breakfast foods', 'Dosha-specific breakfast']
    };
  } else if (lowerMessage.includes('inflammation') || lowerMessage.includes('anti-inflammatory')) {
    return {
      content: `${contextInfo}To reduce inflammation naturally:\n\n• Include turmeric, ginger, and garlic in your diet\n• Eat omega-3 rich foods like flaxseeds and walnuts\n• Include colorful fruits and vegetables\n• Avoid processed and fried foods\n• Stay hydrated with warm water\n• Practice stress management techniques\n\nConsider herbal teas and anti-inflammatory spices.`,
      suggestions: ['Anti-inflammatory foods', 'Herbal remedies', 'Lifestyle changes', 'Inflammation-fighting spices']
    };
  } else if (lowerMessage.includes('golden milk') || lowerMessage.includes('turmeric milk')) {
    return {
      content: `${contextInfo}Golden milk is a traditional Ayurvedic drink:\n\nIngredients:\n• 1 cup warm milk (dairy or plant-based)\n• 1/2 tsp turmeric powder\n• 1/4 tsp black pepper\n• 1/2 tsp ghee or coconut oil\n• 1/4 tsp cinnamon\n• 1 tsp honey (optional)\n\nMix all ingredients and drink warm before bedtime.`,
      suggestions: ['Golden milk variations', 'Best time to drink', 'Golden milk benefits', 'Plant-based alternatives']
    };
  } else if (lowerMessage.includes('six tastes') || lowerMessage.includes('rasa')) {
    return {
      content: `${contextInfo}The six tastes (Rasa) in Ayurveda are:\n\n1. Sweet (Madhura) - Grounding, nourishing\n2. Sour (Amla) - Stimulating, heating\n3. Salty (Lavana) - Moistening, grounding\n4. Pungent (Katu) - Heating, stimulating\n5. Bitter (Tikta) - Cooling, detoxifying\n6. Astringent (Kashaya) - Cooling, drying\n\nA balanced meal should include all six tastes.`,
      suggestions: ['Foods for each taste', 'Balancing tastes', 'Taste and doshas', 'Creating balanced meals']
    };
  } else if (lowerMessage.includes('sattvic') || lowerMessage.includes('sattva')) {
    return {
      content: `${contextInfo}A Sattvic diet promotes clarity and peace:\n\n• Fresh, organic, and seasonal foods\n• Whole grains, fruits, and vegetables\n• Dairy products (fresh and pure)\n• Nuts, seeds, and healthy oils\n• Herbal teas and fresh juices\n• Avoid processed, canned, or frozen foods\n• Eat in a calm, peaceful environment`,
      suggestions: ['Sattvic food list', 'Sattvic recipes', 'Sattvic lifestyle', 'Meditation and diet']
    };
  } else {
    return {
      content: `${contextInfo}I understand you're asking about Ayurveda and health. While I can provide general guidance, please remember that I'm an AI assistant and my responses should not replace professional medical advice. For specific health concerns, always consult with a qualified Ayurvedic practitioner or healthcare provider.\n\nCould you please rephrase your question or ask about a specific aspect of Ayurveda, such as doshas, foods, or lifestyle practices?`,
      suggestions: ['Dosha analysis', 'Food recommendations', 'General Ayurvedic principles', 'Lifestyle guidance']
    };
  }
}

// Helper function to generate patient registration responses
async function generatePatientRegistrationResponse(step, userInput, patientData) {
  const input = userInput.trim();
  
  switch (step) {
    case 'name':
      if (input.length < 2) {
        return {
          content: "Please provide a valid name with at least 2 characters.",
          nextStep: 'name',
          suggestions: ['John Doe', 'Jane Smith', 'Dr. Patel'],
          validationErrors: ['Name must be at least 2 characters long']
        };
      }
      return {
        content: `Great! I've recorded the patient's name as "${input}". Now, what is their email address?`,
        nextStep: 'email',
        suggestions: ['patient@example.com', 'john.doe@gmail.com']
      };

    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input)) {
        return {
          content: "Please provide a valid email address format (e.g., patient@example.com).",
          nextStep: 'email',
          suggestions: ['patient@example.com', 'john.doe@gmail.com'],
          validationErrors: ['Invalid email format']
        };
      }
      return {
        content: `Perfect! Email recorded as "${input}". What's their phone number?`,
        nextStep: 'phone',
        suggestions: ['+1 (555) 123-4567', '555-123-4567']
      };

    case 'phone':
      return {
        content: `Thank you! Phone number recorded. What's their date of birth? Please use YYYY-MM-DD format.`,
        nextStep: 'dateOfBirth',
        suggestions: ['1990-01-15', '1985-06-20', '1995-12-10']
      };

    case 'dateOfBirth':
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(input)) {
        return {
          content: "Please provide the date in YYYY-MM-DD format (e.g., 1990-01-15).",
          nextStep: 'dateOfBirth',
          suggestions: ['1990-01-15', '1985-06-20', '1995-12-10'],
          validationErrors: ['Invalid date format']
        };
      }
      return {
        content: `Got it! Date of birth recorded. What's their gender?`,
        nextStep: 'gender',
        suggestions: ['Male', 'Female', 'Other']
      };

    case 'gender':
      const validGenders = ['male', 'female', 'other'];
      if (!validGenders.includes(input.toLowerCase())) {
        return {
          content: "Please specify Male, Female, or Other.",
          nextStep: 'gender',
          suggestions: ['Male', 'Female', 'Other'],
          validationErrors: ['Please select a valid gender option']
        };
      }
      return {
        content: `Thank you! Now let's get their address. Please provide their street address:`,
        nextStep: 'address',
        suggestions: ['123 Main Street', '456 Oak Avenue']
      };

    case 'healthConditions':
      const conditions = input.toLowerCase().includes('none') ? [] : 
        input.split(',').map(c => c.trim()).filter(c => c.length > 0);
      
      return {
        content: conditions.length === 0 ? 
          "No health conditions recorded. Do they have any allergies? (Please list them, or say 'none')" :
          `Health conditions recorded: ${conditions.join(', ')}. Do they have any allergies? (Please list them, or say 'none')`,
        nextStep: 'allergies',
        suggestions: ['None', 'Peanuts, Shellfish', 'Dairy, Gluten']
      };

    case 'prakritiAnalysis':
      // Analyze prakriti based on collected data
      const prakriti = analyzePrakritiFromData(patientData);
      const prakritiDescription = getPrakritiDescription(prakriti);
      
      return {
        content: `Based on the information provided, I've determined that the patient's constitution (Prakriti) is: **${prakriti}**\n\n${prakritiDescription}\n\nNow I'll generate a personalized diet plan based on their Ayurvedic constitution. This will help balance their doshas and promote optimal health.`,
        nextStep: 'dietGeneration',
        suggestions: ['Generate Diet Plan', 'View Patient Summary']
      };

    default:
      return {
        content: `Thank you for the information about "${input}". Let me process this and move to the next step.`,
        nextStep: 'continue',
        suggestions: ['Continue', 'Review Information']
      };
  }
}

// Helper function to analyze prakriti from patient data
function analyzePrakritiFromData(data) {
  const indicators = { vata: 0, pitta: 0, kapha: 0 };
  
  // Activity level analysis
  if (data.lifestyle?.activityLevel) {
    const activity = data.lifestyle.activityLevel.toLowerCase();
    if (activity.includes('very active') || activity.includes('active')) {
      indicators.vata += 2;
      indicators.pitta += 1;
    } else if (activity.includes('sedentary')) {
      indicators.kapha += 2;
    } else if (activity.includes('moderate')) {
      indicators.pitta += 1;
      indicators.kapha += 1;
    }
  }

  // Stress level analysis
  if (data.lifestyle?.stressLevel) {
    const stress = data.lifestyle.stressLevel.toLowerCase();
    if (stress.includes('high') || stress.includes('very high')) {
      indicators.vata += 2;
      indicators.pitta += 1;
    } else if (stress.includes('low')) {
      indicators.kapha += 1;
    }
  }

  // Age analysis (younger tends toward Pitta, older toward Vata)
  if (data.personalInfo?.dateOfBirth) {
    const age = new Date().getFullYear() - new Date(data.personalInfo.dateOfBirth).getFullYear();
    if (age < 30) {
      indicators.pitta += 1;
    } else if (age > 50) {
      indicators.vata += 1;
    } else {
      indicators.kapha += 1;
    }
  }

  // Determine dominant dosha
  const maxScore = Math.max(indicators.vata, indicators.pitta, indicators.kapha);
  const dominantDoshas = [];
  
  if (indicators.vata === maxScore) dominantDoshas.push('Vata');
  if (indicators.pitta === maxScore) dominantDoshas.push('Pitta');
  if (indicators.kapha === maxScore) dominantDoshas.push('Kapha');

  if (dominantDoshas.length === 2) {
    return dominantDoshas.join('-');
  } else if (dominantDoshas.length === 1) {
    return dominantDoshas[0];
  } else {
    return 'Vata-Pitta-Kapha'; // Tri-doshic
  }
}

// Helper function to get prakriti descriptions
function getPrakritiDescription(prakriti) {
  const descriptions = {
    'Vata': 'Vata constitution is characterized by qualities of air and space. People with Vata prakriti are typically energetic, creative, and quick-thinking, but may be prone to anxiety, irregular routines, and digestive issues. They benefit from warm, grounding foods and regular routines.',
    'Pitta': 'Pitta constitution embodies fire and water elements. Pitta types are usually focused, ambitious, and have strong digestion and metabolism, but may be prone to irritability, inflammation, and heat-related conditions. They benefit from cooling, calming foods and avoiding excessive heat.',
    'Kapha': 'Kapha constitution represents earth and water elements. Kapha types are generally calm, stable, and have strong immunity and endurance, but may be prone to sluggishness, weight gain, and respiratory issues. They benefit from light, warming, and stimulating foods.',
    'Vata-Pitta': 'This dual constitution combines the mobility and creativity of Vata with the intensity and focus of Pitta. These individuals need both grounding and cooling approaches in their diet and lifestyle.',
    'Pitta-Kapha': 'This combination brings together Pitta\'s metabolic fire with Kapha\'s structural stability. They benefit from foods that are neither too heating nor too cooling.',
    'Vata-Kapha': 'This constitution balances Vata\'s mobility with Kapha\'s grounding nature. They need warming foods that are not too heavy or too light.',
    'Vata-Pitta-Kapha': 'This rare tri-doshic constitution has balanced qualities of all three doshas. They can generally tolerate a wide variety of foods but should maintain balance and avoid extremes.'
  };
  return descriptions[prakriti] || 'Balanced constitution with unique characteristics.';
}

module.exports = router;






