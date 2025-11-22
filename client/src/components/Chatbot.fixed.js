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

const Chatbot = ({ onPatientUpdate }) => {
  const { selectedPatient } = usePatients();
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
      const isDoshaResult = inputMessage.includes('Mapped to') && 
                           (inputMessage.includes('Vata') || 
                            inputMessage.includes('Pitta') || 
                            inputMessage.includes('Kapha'));

      let botMessage;
      
      if (isDoshaResult && selectedPatient) {
        // Extract the dosha from the message
        const doshaMatch = inputMessage.match(/Mapped to\s+(Vata|Pitta|Kapha)/i);
        const dosha = doshaMatch ? doshaMatch[1] : null;
        
        if (dosha) {
          try {
            const response = await fetch(`/api/patients/${selectedPatient._id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                'healthProfile.prakriti': dosha
              })
            });

            if (!response.ok) {
              throw new Error('Failed to update patient data');
            }

            const data = await response.json();

            // Refresh the patient data
            if (onPatientUpdate) {
              onPatientUpdate({ 
                ...selectedPatient, 
                healthProfile: { 
                  ...selectedPatient.healthProfile, 
                  prakriti: dosha 
                } 
              });
            }

            // Create a success message
            botMessage = {
              id: Date.now() + 1,
              type: 'bot',
              content: `✅ Successfully updated ${selectedPatient.name}'s dosha to ${dosha}.`,
              timestamp: new Date()
            };
          } catch (updateError) {
            // Silently log the error
            console.error('Error updating patient data (silent):', updateError);
            // Continue with regular message flow
            return;
          }
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
      
      botMessage = botMessage || {
        id: Date.now() + 1,
        type: 'bot',
        content: data.response,
        suggestions: data.suggestions || [],
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      // Silently log the error
      console.error('Error in chatbot (silent):', error);
      // Continue with a generic response
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
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
      </div>
    </div>
  );
};

export default Chatbot;
