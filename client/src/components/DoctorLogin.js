import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Plus, ArrowLeft, Shield, FileText, LogIn, Stethoscope, Sparkles, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const DoctorLogin = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    specialization: '',
    licenseNumber: '',
    phone: ''
  });

  const { login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handlePasswordFocus = (ref) => {
    if (ref.current) {
      const input = ref.current;
      input.type = 'password';
      input.removeAttribute('readOnly');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          navigate('/doctor-dashboard');
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          setLoading(false);
          return;
        }

        const userData = {
          ...formData,
          role: 'doctor'
        };
        delete userData.confirmPassword;

        const result = await register(userData);
        if (result.success) {
          navigate('/doctor-dashboard');
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      specialization: '',
      licenseNumber: '',
      phone: ''
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)'}}>
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Side - Branding & Features */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden md:block space-y-8"
        >
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 via-blue-500 to-purple-500 flex items-center justify-center shadow-2xl transform rotate-6 hover:rotate-12 transition-transform duration-300">
                <Stethoscope className="h-10 w-10 text-white transform -rotate-6" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-6xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AiAyush
                </span>
              </h1>
              <p className="text-gray-600 font-semibold text-lg">AI-Powered Healthcare</p>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-6 pt-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-start space-x-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">AI-Powered Analysis</h3>
                <p className="text-gray-600">Intelligent dosha detection with personalized Ayurvedic recommendations</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-start space-x-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Smart Patient Management</h3>
                <p className="text-gray-600">Comprehensive tracking with automated diet planning and progress monitoring</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-start space-x-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Real-time Insights</h3>
                <p className="text-gray-600">Advanced analytics dashboard with actionable health insights</p>
              </div>
            </motion.div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 pt-8">
            <div className="text-center">
              <div className="text-4xl font-black bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">500+</div>
              <div className="text-sm text-gray-600 font-medium">Doctors</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">10K+</div>
              <div className="text-sm text-gray-600 font-medium">Patients</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">98%</div>
              <div className="text-sm text-gray-600 font-medium">Satisfaction</div>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full"
        >
          {/* Mobile Logo */}
          <div className="md:hidden text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center shadow-xl transform rotate-6">
                  <Stethoscope className="h-7 w-7 text-white transform -rotate-6" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center animate-pulse">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                AiAyush
              </h1>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/50">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">
                {isLogin ? (
                  <>
                    <span className="text-gray-900">Welcome to </span>
                    <span className="text-green-600">AiAyush</span>
                    <span className="text-gray-900"> 👋</span>
                  </>
                ) : (
                  <>
                    <span className="text-gray-900">Join </span>
                    <span className="text-green-600">AiAyush</span>
                    <span className="text-gray-900"> ✨</span>
                  </>
                )}
              </h2>
              <p className="text-gray-600">
                {isLogin 
                  ? 'Sign in to access your AI-powered dashboard' 
                  : 'Create your account and start managing patients'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <>
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required={!isLogin}
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                      placeholder="Dr. John Doe"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="specialization" className="block text-sm font-semibold text-gray-700 mb-2">
                        Specialization
                      </label>
                      <input
                        id="specialization"
                        name="specialization"
                        type="text"
                        value={formData.specialization}
                        onChange={handleChange}
                        className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                        placeholder="Ayurveda"
                      />
                    </div>

                    <div>
                      <label htmlFor="licenseNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                        License Number
                      </label>
                      <input
                        id="licenseNumber"
                        name="licenseNumber"
                        type="text"
                        value={formData.licenseNumber}
                        onChange={handleChange}
                        className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                        placeholder="License #"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="off"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    data-lpignore="true"
                    data-form-type="other"
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                    placeholder="doctor@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    ref={passwordRef}
                    type={isMounted ? (showPassword ? 'text' : 'password') : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => handlePasswordFocus(passwordRef)}
                    readOnly={!isMounted}
                    data-lpignore="true"
                    data-form-type="other"
                    className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                    placeholder="••••••••"
                    style={{
                      WebkitTextSecurity: 'disc',
                      msTextSecurity: 'disc',
                      textSecurity: 'disc'
                    }}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-gray-700 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      ref={confirmPasswordRef}
                      type={isMounted ? 'password' : 'text'}
                      autoComplete="new-password"
                      required={!isLogin}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onFocus={() => handlePasswordFocus(confirmPasswordRef)}
                      readOnly={!isMounted}
                      data-lpignore="true"
                      data-form-type="other"
                      data-1p-ignore
                      data-bwignore
                      data-bwignore-field
                      autoCorrect="off"
                      spellCheck="false"
                      autoCapitalize="off"
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    {isLogin ? <LogIn className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  </>
                )}
              </button>

              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {isLogin 
                    ? "Don't have an account? " 
                    : "Already have an account? "}
                  <span className="text-green-600 hover:text-green-700 font-bold">
                    {isLogin ? 'Register here' : 'Sign in'}
                  </span>
                </button>
              </div>

              <div className="text-center pt-2">
                <Link
                  to="/"
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors inline-flex items-center space-x-1"
                >
                  <span>←</span>
                  <span>Back to Homepage</span>
                </Link>
              </div>
            </form>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default DoctorLogin;
