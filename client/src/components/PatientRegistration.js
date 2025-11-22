import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  User, 
  Bot, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader,
  Save,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePatients } from '../contexts/PatientContext';
import axios from 'axios';

const PatientRegistration = () => {
  const { user } = useAuth();
  const { addPatient } = usePatients();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "🤖 Hi Doctor! I'm AiAyush, your AI assistant. I'll register a new patient with just a few relevant questions to infer dosha and generate a six-taste (rasa) balanced diet plan. What is the patient's full name?",
      timestamp: new Date()
    }
  ]);
  
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [patientData, setPatientData] = useState({
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      }
    },
    healthProfile: {
      prakriti: 'Vata', // Default to prevent validation errors
      vikriti: '',
      healthConditions: [],
      allergies: [],
      medications: []
    },
    lifestyle: {
      activityLevel: '',
      sleepPattern: {
        bedtime: '',
        wakeTime: '',
        quality: ''
      },
      dietPreferences: [],
      exerciseRoutine: '',
      stressLevel: ''
    }
  });
  
  const [currentStep, setCurrentStep] = useState('name');
  const [isComplete, setIsComplete] = useState(false);
  const [lastPatientId, setLastPatientId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user || (user.role !== 'doctor' && user.role !== 'practitioner')) {
      navigate('/doctor-login');
    }
  }, [user, navigate]);

  // Step configuration and option sets
  const steps = {
    name: { field: 'personalInfo.name', next: 'email', question: "Great! Now, what is their email address?" },
    email: { field: 'personalInfo.email', next: 'allergies', question: "Any allergies? (comma separated, or type 'none')" },
    allergies: { field: 'healthProfile.allergies', next: 'healthConditions', question: "Any known health conditions? (comma separated, or type 'none')" },
    healthConditions: { field: 'healthProfile.healthConditions', next: 'bodyFrame', question: "Thanks! Let's begin the quick assessment. How is their body frame?" },
    bodyFrame: { field: 'intake.bodyFrame', next: 'skinType', question: "What is their skin type?" },
    skinType: { field: 'intake.skinType', next: 'hairType', question: "Hair type?" },
    hairType: { field: 'intake.hairType', next: 'eyeType', question: "Eye type?" },
    eyeType: { field: 'intake.eyeType', next: 'appetite', question: "Appetite & digestion?" },
    appetite: { field: 'intake.appetite', next: 'sleepPattern', question: "Sleep pattern?" },
    sleepPattern: { field: 'intake.sleepPattern', next: 'climateTolerance', question: "Tolerance to climate?" },
    climateTolerance: { field: 'intake.climateTolerance', next: 'thinkingStyle', question: "Thinking style?" },
    thinkingStyle: { field: 'intake.thinkingStyle', next: 'emotionalTendencies', question: "Emotional tendencies?" },
    emotionalTendencies: { field: 'intake.emotionalTendencies', next: 'speech', question: "Speech?" },
    speech: { field: 'intake.speech', next: 'physicalActivity', question: "Physical activity?" },
    physicalActivity: { field: 'intake.physicalActivity', next: 'adaptability', question: "Adaptability?" },
    adaptability: { field: 'intake.adaptability', next: 'complete', question: "Analyzing Prakriti from the inputs..." }
  };

  const stepOptions = {
    bodyFrame: [
      { label: 'Thin, underweight', value: 'Vata' },
      { label: 'Medium, athletic', value: 'Pitta' },
      { label: 'Large, well-built / gain-prone', value: 'Kapha' }
    ],
    skinType: [
      { label: 'Dry, rough', value: 'Vata' },
      { label: 'Warm, reddish, sensitive / acne-prone', value: 'Pitta' },
      { label: 'Smooth, oily, pale, thick', value: 'Kapha' }
    ],
    hairType: [
      { label: 'Dry, frizzy, thin', value: 'Vata' },
      { label: 'Straight, fine, early greying/balding', value: 'Pitta' },
      { label: 'Thick, oily, lustrous', value: 'Kapha' }
    ],
    eyeType: [
      { label: 'Small, dry, dull', value: 'Vata' },
      { label: 'Sharp, medium, reddish, intense', value: 'Pitta' },
      { label: 'Big, calm, attractive, moist', value: 'Kapha' }
    ],
    appetite: [
      { label: 'Irregular, variable, bloating', value: 'Vata' },
      { label: 'Strong, sharp hunger, acidity', value: 'Pitta' },
      { label: 'Slow, steady, heaviness', value: 'Kapha' }
    ],
    sleepPattern: [
      { label: 'Light, interrupted, insomnia-prone', value: 'Vata' },
      { label: 'Moderate, easily disturbed', value: 'Pitta' },
      { label: 'Deep, heavy, hard to wake', value: 'Kapha' }
    ],
    climateTolerance: [
      { label: 'Sensitive to cold, wind', value: 'Vata' },
      { label: 'Sensitive to heat', value: 'Pitta' },
      { label: 'Sensitive to damp, cold', value: 'Kapha' }
    ],
    thinkingStyle: [
      { label: 'Quick, creative, forgetful', value: 'Vata' },
      { label: 'Sharp, determined, critical', value: 'Pitta' },
      { label: 'Calm, slow, steady, good memory', value: 'Kapha' }
    ],
    emotionalTendencies: [
      { label: 'Anxiety, fear, insecurity', value: 'Vata' },
      { label: 'Anger, irritability, competitiveness', value: 'Pitta' },
      { label: 'Attachment, calmness, stubbornness', value: 'Kapha' }
    ],
    speech: [
      { label: 'Fast, unclear, irregular', value: 'Vata' },
      { label: 'Sharp, clear, assertive', value: 'Pitta' },
      { label: 'Slow, sweet, pleasant', value: 'Kapha' }
    ],
    physicalActivity: [
      { label: 'Restless, overactive, fatigue easily', value: 'Vata' },
      { label: 'Moderate, goal-oriented', value: 'Pitta' },
      { label: 'Slow, avoids extra activity', value: 'Kapha' }
    ],
    adaptability: [
      { label: 'Very adaptable, inconsistent', value: 'Vata' },
      { label: 'Somewhat adaptable, goal-driven', value: 'Pitta' },
      { label: 'Stable, resistant to change', value: 'Kapha' }
    ]
  };

  const isOptionStep = (stepKey) => Boolean(stepOptions[stepKey]);

  const handleOptionSelect = async (optionLabel) => {
    setCurrentMessage(optionLabel);
    await handleSendMessage();
  };

  const setNestedValue = (obj, path, value) => {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  };

  const analyzePrakriti = (data) => {
    const score = { Vata: 0, Pitta: 0, Kapha: 0 };

    const add = (dosha, n = 1) => { score[dosha] = (score[dosha] || 0) + n; };

    // Map selections to doshas (each step contributes +1 or +2)
    const s = data.intake || {};
    const weight = (v) => v ? 1 : 0;

    // Body & Physical Features
    if (s.bodyFrame) add(s.bodyFrame, 2);
    if (s.skinType) add(s.skinType, 1);
    if (s.hairType) add(s.hairType, 1);
    if (s.eyeType) add(s.eyeType, 1);

    // Physiology
    if (s.appetite) add(s.appetite, 2);
    if (s.sleepPattern) add(s.sleepPattern, 1);
    if (s.climateTolerance) add(s.climateTolerance, 1);

    // Mind & Behavior
    if (s.thinkingStyle) add(s.thinkingStyle, 1);
    if (s.emotionalTendencies) add(s.emotionalTendencies, 1);
    if (s.speech) add(s.speech, 1);

    // Lifestyle
    if (s.physicalActivity) add(s.physicalActivity, 1);
    if (s.adaptability) add(s.adaptability, 1);

    // Determine dominant dosha(s) - cap at 2 to satisfy schema enum
    const entries = Object.entries(score);
    entries.sort((a,b) => b[1]-a[1]);
    const top = entries[0];
    const second = entries[1];

    if (!top || top[1] === 0) return 'Vata';
    
    // If there's a tie or close second, return dual dosha in correct order
    if (second && (second[1] === top[1] || second[1] >= top[1] * 0.8)) {
      // Ensure valid dual combinations: Vata-Pitta, Pitta-Kapha, Vata-Kapha
      const doshas = [top[0], second[0]].sort();
      if (doshas[0] === 'Kapha' && doshas[1] === 'Pitta') return 'Pitta-Kapha';
      if (doshas[0] === 'Kapha' && doshas[1] === 'Vata') return 'Vata-Kapha';
      if (doshas[0] === 'Pitta' && doshas[1] === 'Vata') return 'Vata-Pitta';
      // Fallback: if somehow we get same dosha twice, return single
      return top[0];
    }
    return top[0];
  };

  const processHealthConditions = (text) => {
    if (text.toLowerCase().includes('none')) return [];
    return text.split(',').map(condition => ({
      name: condition.trim(),
      severity: 'Moderate',
      diagnosedDate: new Date(),
      notes: ''
    }));
  };

  const processAllergies = (text) => {
    if (text.toLowerCase().includes('none')) return [];
    return text.split(',').map(allergen => ({
      allergen: allergen.trim(),
      severity: 'Moderate',
      reaction: ''
    }));
  };

  const processMedications = (text) => {
    if (text.toLowerCase().includes('none')) return [];
    return text.split(',').map(med => ({
      name: med.trim(),
      dosage: '',
      frequency: '',
      startDate: new Date(),
      notes: ''
    }));
  };

  const processSleepPattern = (text) => {
    const times = text.match(/\d{1,2}:\d{2}|\d{1,2}\s*(am|pm|AM|PM)/g);
    return {
      bedtime: times && times[0] ? times[0] : text.split(' ')[0] || '',
      wakeTime: times && times[1] ? times[1] : text.split(' ')[1] || '',
      quality: 'Good'
    };
  };

  const processDietPreferences = (text) => {
    if (text.toLowerCase().includes('none')) return [];
    return text.split(',').map(pref => pref.trim());
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Process the user input based on current step
    const newPatientData = { ...patientData };
    const stepConfig = steps[currentStep];

    if (stepConfig) {
      let processedValue = currentMessage.trim();

      // Validation and normalization per step
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      // If this is an option step, map label -> value (Vata/Pitta/Kapha)
      if (isOptionStep(currentStep)) {
        const opts = stepOptions[currentStep] || [];
        const picked = opts.find(o => o.label.toLowerCase() === processedValue.toLowerCase());
        if (!picked) {
          const botMessage = {
            id: messages.length + 2,
            type: 'bot',
            content: 'Please choose one of the provided options.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botMessage]);
          setIsLoading(false);
          setCurrentMessage('');
          return;
        }
        processedValue = picked.value; // store dosha value
      }

      if (currentStep === 'email') {
        if (!emailRegex.test(processedValue)) {
          const botMessage = {
            id: messages.length + 2,
            type: 'bot',
            content: "Please provide a valid email address (e.g., patient@example.com).",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botMessage]);
          setIsLoading(false);
          setCurrentMessage('');
          return;
        }
        processedValue = processedValue.toLowerCase();
      }

      if (currentStep === 'allergies') {
        processedValue = processAllergies(processedValue);
      }

      if (currentStep === 'healthConditions') {
        processedValue = processHealthConditions(processedValue);
      }

      // Obsolete validations removed; option steps handled via buttons mapping

      // Special processing for certain fields
      if (stepConfig.field === 'healthProfile.medications') {
        processedValue = processMedications(currentMessage);
      } else if (stepConfig.field === 'lifestyle.sleepPattern') {
        processedValue = processSleepPattern(currentMessage);
      } else if (stepConfig.field === 'lifestyle.dietPreferences') {
        processedValue = processDietPreferences(currentMessage);
      }

      setNestedValue(newPatientData, stepConfig.field, processedValue);
      setPatientData(newPatientData);

      // Special handling for prakriti analysis (run after final input: adaptability)
      if (currentStep === 'adaptability') {
        setTimeout(async () => {
          try {
            const prakriti = analyzePrakriti(newPatientData);
            const updatedData = { ...newPatientData };
            updatedData.healthProfile.prakriti = prakriti;
            setPatientData(updatedData);

            // Save the patient
            const result = await savePatient(updatedData, { generate: false });
            setLastPatientId(result.patientId);

            // Navigate to diet preferences for season/region selection
            const params = new URLSearchParams({
              dosha: prakriti,
              fromChatbot: 'true',
              name: updatedData.personalInfo?.name || '',
              email: updatedData.personalInfo?.email || ''
            });
            navigate(`/diet-preferences?${params.toString()}`);
          } catch (err) {
            console.error('Error in adaptability step:', err);
            const errorMsg = err?.message || 'Failed to save patient';
            const errorBotMessage = {
              id: messages.length + 2,
              type: 'bot',
              content: `❌ Error: ${errorMsg}\n\nPlease check the console for more details or try again.`,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, errorBotMessage]);
          } finally {
            setIsLoading(false);
          }
        }, 600);
      } else if (stepConfig.next === 'complete') {
        // Save patient and complete registration
        setTimeout(async () => {
          try {
            await savePatient(newPatientData);
            setIsComplete(true);
            
            const botMessage = {
              id: messages.length + 2,
              type: 'bot',
              content: `🎉 **Patient registration completed successfully!**\n\nPatient: ${newPatientData.personalInfo.name}\nConstitution: ${newPatientData.healthProfile.prakriti}\n\nI've saved all the information and will now generate a personalized diet plan based on their Ayurvedic constitution. You can view and manage this patient from your dashboard.`,
              timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
            setIsLoading(false);
          } catch (error) {
            // Suppress error message for smooth UX and proceed to diet generator
            navigate('/diet-generator');
            setIsLoading(false);
          }
        }, 600);
      } else {
        // Continue to next step
        setTimeout(() => {
          const botMessage = {
            id: messages.length + 2,
            type: 'bot',
            content: stepConfig.question,
            timestamp: new Date()
          };

          setMessages(prev => [...prev, botMessage]);
          setCurrentStep(stepConfig.next);
          setIsLoading(false);
        }, 400);
      }
    }

    setCurrentMessage('');
  };

  const getPrakritiDescription = (prakriti) => {
    const descriptions = {
      'Vata': 'Vata types are typically energetic, creative, and quick-thinking, but may be prone to anxiety and irregular routines.',
      'Pitta': 'Pitta types are usually focused, ambitious, and have strong digestion, but may be prone to irritability and inflammation.',
      'Kapha': 'Kapha types are generally calm, stable, and have strong immunity, but may be prone to sluggishness and weight gain.',
      'Vata-Pitta': 'This dual constitution combines the creativity of Vata with the focus of Pitta.',
      'Pitta-Kapha': 'This combination brings together Pitta\'s intensity with Kapha\'s stability.',
      'Vata-Kapha': 'This constitution balances Vata\'s mobility with Kapha\'s grounding nature.'
    };
    return descriptions[prakriti] || '';
  };

  const savePatient = async (data, options = {}) => {
    try {
      // Remove intake field as it's not part of the Patient model
      const { intake, ...cleanData } = data;
      
      // Clean up empty strings and undefined values
      const cleanPayload = (obj) => {
        if (Array.isArray(obj)) {
          return obj.map(cleanPayload);
        } else if (obj && typeof obj === 'object' && !(obj instanceof Date)) {
          const cleaned = {};
          for (const [key, value] of Object.entries(obj)) {
            if (value === '' || value === undefined || value === null) {
              // Skip empty strings, undefined, and null
              continue;
            }
            cleaned[key] = cleanPayload(value);
          }
          return Object.keys(cleaned).length > 0 ? cleaned : undefined;
        }
        return obj;
      };
      
      const patientPayload = {
        ...cleanPayload(cleanData),
        status: 'Active',
        // Ensure required fields are present
        personalInfo: {
          name: cleanData.personalInfo?.name || '',
          email: cleanData.personalInfo?.email || '',
          ...(cleanData.personalInfo?.phone && { phone: cleanData.personalInfo.phone }),
          ...(cleanData.personalInfo?.gender && { gender: cleanData.personalInfo.gender })
        },
        healthProfile: {
          prakriti: cleanData.healthProfile?.prakriti || 'Vata',
          ...(cleanData.healthProfile?.healthConditions?.length > 0 && { 
            healthConditions: cleanData.healthProfile.healthConditions 
          }),
          ...(cleanData.healthProfile?.allergies?.length > 0 && { 
            allergies: cleanData.healthProfile.allergies 
          }),
          ...(cleanData.healthProfile?.medications?.length > 0 && { 
            medications: cleanData.healthProfile.medications 
          })
        }
      };

      console.log('Saving patient with payload:', JSON.stringify(patientPayload, null, 2));
      const result = await addPatient(patientPayload);
      if (!result.success || !result.patient) {
        // Retry once on duplicate email by appending a timestamp
        const msg = result.error || '';
        if (/already exists/i.test(msg) && data?.personalInfo?.email) {
          const parts = data.personalInfo.email.split('@');
          const uniqueEmail = `${parts[0]}+${Date.now()}@${parts[1] || ''}`;
          const retryPayload = {
            ...patientPayload,
            personalInfo: {
              ...patientPayload.personalInfo,
              email: uniqueEmail
            }
          };
          const retry = await addPatient(retryPayload);
          if (!retry.success || !retry.patient) {
            throw new Error(retry.error || 'Failed to save patient');
          }
          toast('Email was duplicate; saved with adjusted email');
          return { patientId: retry.patient._id };
        }
        throw new Error(msg || 'Failed to save patient');
      }

      // Optionally auto-generate a diet plan based on prakriti (skipped when options.generate === false)
      if (options.generate !== false) {
        try {
          const goals = ['Balance doshas', 'Improve overall wellness'];
          const duration = 7; // default to 7 days
          const dosha = data.healthProfile?.prakriti || 'Vata';

          await axios.post('/api/diet-plans/generate', {
            patientId: result.patient._id,
            dosha,
            healthConditions: (data.healthProfile?.healthConditions || []).map(h => h.name),
            goals,
            duration,
            fast: Boolean(options.fast)
          });
        } catch (dietErr) {
          console.error('Diet generation error:', dietErr);
        }
      }
      return { patientId: result.patient._id };
    } catch (error) {
      console.error('Error saving patient:', error);
      throw new Error(error.response?.data?.message || 'Failed to save patient');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const resetRegistration = () => {
    setMessages([
      {
        id: 1,
        type: 'bot',
        content: "🤖 Hi Doctor! I'm AiAyush, your AI assistant. I'll register a new patient with just a few relevant questions to infer dosha and generate a six-taste (rasa) balanced diet plan. What is the patient's full name?",
        timestamp: new Date()
      }
    ]);
    setPatientData({
      personalInfo: {
        name: '',
        email: ''
      },
      healthProfile: {
        prakriti: '',
        vikriti: ''
      },
      lifestyle: {},
      intake: { thermal: '', appetite: '', bodyBuild: '', sleep: '' }
    });
    setCurrentStep('name');
    setIsComplete(false);
    setCurrentMessage('');
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen ayur-page">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/doctor-dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold ayur-title">Patient Registration</h1>
              {isComplete && (
                <button
                  onClick={resetRegistration}
                  className="flex items-center px-4 py-2 text-sm font-medium text-ayurvedic.green hover:text-green-600 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Register Another
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="medical-card ayur-card h-[600px] flex flex-col"
        >
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 flex items-center">
            <div className="flex items-center">
              <div className="relative bg-gradient-to-br from-ayurvedic.green to-ayurvedic.blue p-3 rounded-full shadow-lg">
                <MessageCircle className="h-5 w-5 text-white" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold">
                  <span className="bg-gradient-to-r from-ayurvedic.green to-ayurvedic.blue bg-clip-text text-transparent">
                    🤖 AiAyush Assistant
                  </span>
                </h3>
                <p className="text-sm text-gray-600">AI-powered patient registration & dosha analysis</p>
              </div>
            </div>
            {isComplete && (
              <div className="ml-auto flex items-center text-green-600">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Registration Complete</span>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-xs lg:max-w-md ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 ${message.type === 'user' ? 'ml-3' : 'mr-3'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.type === 'user' 
                          ? 'bg-ayurvedic.green text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-ayurvedic.green text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      <div className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-green-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex mr-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                </div>
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Processing...</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Interactive Options / Input */}
          {!isComplete && (
            <div className="p-4 border-t border-gray-200">
              {isOptionStep(currentStep) ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(stepOptions[currentStep] || []).map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleOptionSelect(opt.label)}
                        disabled={isLoading}
                        className="w-full text-left px-4 py-3 rounded-lg border border-gray-300 hover:border-ayurvedic.green hover:bg-green-50 transition-colors disabled:opacity-50"
                      >
                        <span className="block text-sm font-medium text-health.dark">{opt.label}</span>
                        <span className="block text-xs text-gray-500">Mapped to {opt.value}</span>
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">Tip: Click one option to continue.</div>
                </div>
              ) : (
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your response..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ayurvedic.green focus:border-transparent"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !currentMessage.trim()}
                    className="px-4 py-2 bg-ayurvedic.green text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-ayurvedic.green disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Complete Actions */}
          {isComplete && (
            <div className="p-4 border-t border-gray-200 bg-green-50">
              <div className="flex justify-between items-center">
                <div className="flex items-center text-green-700">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="font-medium">Patient registered successfully!</span>
                </div>
                <div className="flex space-x-3">
                  {lastPatientId && (
                    <button
                      onClick={() => navigate(`/diet-plan/${lastPatientId}`)}
                      className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      View Plan
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/doctor-dashboard')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    View Dashboard
                  </button>
                  <button
                    onClick={resetRegistration}
                    className="px-4 py-2 text-sm font-medium rounded-lg ayur-cta-btn transition-colors"
                  >
                    Register Another Patient
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PatientRegistration;
