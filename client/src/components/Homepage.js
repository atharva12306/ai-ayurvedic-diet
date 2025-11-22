import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Star, 
  Users, 
  Stethoscope, 
  Heart, 
  Shield, 
  Zap, 
  ArrowRight,
  Menu,
  X,
  CheckCircle,
  Clock,
  Award,
  Sparkles
} from 'lucide-react';

const Homepage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(true);

  const reviews = [
    {
      id: 1,
      name: 'Dr. Priya Sharma',
      specialty: 'Ayurvedic Physician',
      rating: 5,
      comment: 'This system has revolutionized how I manage my patients\' diets. The AI recommendations are incredibly accurate.',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face'
    },
    {
      id: 2,
      name: 'Dr. Rajesh Kumar',
      specialty: 'Integrative Medicine',
      rating: 5,
      comment: 'The comprehensive food database and dosha-based recommendations have improved patient outcomes significantly.',
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face'
    },
    {
      id: 3,
      name: 'Dr. Anita Patel',
      specialty: 'Wellness Consultant',
      rating: 5,
      comment: 'The patient tracking and progress monitoring features are exceptional. Highly recommend to all practitioners.',
      avatar: 'https://images.unsplash.com/photo-1594824388852-8a7b3b4b8b8b?w=100&h=100&fit=crop&crop=face'
    }
  ];

  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Patient Management',
      description: 'Comprehensive patient profiles with health history, dosha analysis, and treatment tracking.'
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'AI Diet Generator',
      description: 'Intelligent meal planning based on individual constitution, health conditions, and Ayurvedic principles.'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Food Database',
      description: 'Extensive database of foods with nutritional information, taste profiles, and dosha compatibility.'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Real-time Analytics',
      description: 'Track patient progress, nutrition analytics, and practice performance with detailed reports.'
    }
  ];

  const stats = [
    { number: '500+', label: 'Active Practitioners' },
    { number: '10,000+', label: 'Patients Managed' },
    { number: '50,000+', label: 'Diet Plans Generated' },
    { number: '98%', label: 'Satisfaction Rate' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-health.light to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center shadow-lg transform rotate-6">
                    <Stethoscope className="h-5 w-5 text-white transform -rotate-6" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                    <Sparkles className="h-2 w-2 text-white" />
                  </div>
                </div>
                <span className="ml-3 text-2xl font-black bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AiAyush
                </span>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#features" className="text-gray-700 hover:text-ayurvedic.green px-3 py-2 text-sm font-medium transition-colors">
                  Features
                </a>
                <a href="#reviews" className="text-gray-700 hover:text-ayurvedic.green px-3 py-2 text-sm font-medium transition-colors">
                  Reviews
                </a>
                <a href="#about" className="text-gray-700 hover:text-ayurvedic.green px-3 py-2 text-sm font-medium transition-colors">
                  About
                </a>
                <Link
                  to="/doctor-login"
                  className="bg-ayurvedic.green text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                >
                  Doctor Login
                </Link>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-ayurvedic.green focus:outline-none"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <a href="#features" className="text-gray-700 hover:text-ayurvedic.green block px-3 py-2 text-base font-medium">
                Features
              </a>
              <a href="#reviews" className="text-gray-700 hover:text-ayurvedic.green block px-3 py-2 text-base font-medium">
                Reviews
              </a>
              <a href="#about" className="text-gray-700 hover:text-ayurvedic.green block px-3 py-2 text-base font-medium">
                About
              </a>
              <Link
                to="/doctor-login"
                className="bg-ayurvedic.green text-white block px-3 py-2 rounded-lg text-base font-medium hover:bg-green-600 transition-colors"
              >
                Doctor Login
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="mb-4">
                <span className="inline-block px-4 py-2 bg-gradient-to-r from-ayurvedic.green/10 to-ayurvedic.blue/10 rounded-full text-sm font-semibold text-ayurvedic.green border border-ayurvedic.green/20">
                  🤖 AI-Powered Ayurvedic Intelligence
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-health.dark mb-6">
                Welcome to AiAyush
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Next-Generation AI-Powered Ayurvedic Diet Management System for Modern Healthcare Practitioners
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/doctor-login"
                  className="bg-ayurvedic.green text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-600 transition-colors inline-flex items-center justify-center"
                >
                  Doctor Login
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <button className="border-2 border-ayurvedic.green text-ayurvedic.green px-8 py-4 rounded-lg text-lg font-semibold hover:bg-ayurvedic.green hover:text-white transition-colors">
                  Watch Demo
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-full -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-ayurvedic.green opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-ayurvedic.blue opacity-10 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-ayurvedic.green mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-health.light to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-health.dark mb-4">
              Powerful Features for Modern Practitioners
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage your Ayurvedic practice and provide personalized care
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="medical-card p-6 text-center card-hover"
              >
                <div className="text-ayurvedic.green mb-4 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-health.dark mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-health.dark mb-4">
              Trusted by Healthcare Professionals
            </h2>
            <p className="text-xl text-gray-600">
              See what practitioners are saying about our platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="medical-card p-6 card-hover"
              >
                <div className="flex items-center mb-4">
                  <img
                    src={review.avatar}
                    alt={review.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-health.dark">{review.name}</h4>
                    <p className="text-sm text-gray-600">{review.specialty}</p>
                  </div>
                </div>
                <div className="flex items-center mb-3">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 italic">"{review.comment}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 ayurvedic-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Practice?
            </h2>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Join thousands of practitioners who are already using our platform to provide better care
            </p>
            <Link
              to="/dashboard"
              className="bg-white text-ayurvedic.green px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
            >
              Start Your Free Trial Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-health.dark text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center shadow-lg transform rotate-6">
                    <Stethoscope className="h-5 w-5 text-white transform -rotate-6" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                    <Sparkles className="h-2 w-2 text-white" />
                  </div>
                </div>
                <span className="ml-3 text-xl font-black">AiAyush</span>
              </div>
              <p className="text-gray-400">
                AI-Powered Ayurvedic Intelligence for Modern Healthcare.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Patient Management</li>
                <li>Diet Generator</li>
                <li>Food Database</li>
                <li>Analytics</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Documentation</li>
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Training</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>About Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Careers</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AiAyush. All rights reserved. Powered by AI for Ayurvedic Excellence.</p>
          </div>
        </div>
      </footer>

      {/* Notification Popup */}
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-50 border-l-4 border-ayurvedic.green"
        >
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-ayurvedic.green mt-0.5 mr-3" />
            <div className="flex-1">
              <h4 className="font-semibold text-health.dark mb-1">Welcome to AiAyush!</h4>
              <p className="text-sm text-gray-600 mb-2">
                Experience AI-powered Ayurvedic practice management with intelligent diet recommendations.
              </p>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                Free trial for 30 days
              </div>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Homepage;






