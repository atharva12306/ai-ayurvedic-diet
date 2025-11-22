import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Activity,
  TrendingUp,
  Clock,
  LogOut,
  Settings,
  Bell,
  MessageCircle,
  Stethoscope,
  Heart,
  ChevronRight,
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePatients } from '../contexts/PatientContext';

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const { patients, getPatientStats, deletePatient } = usePatients();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'doctor' && user.role !== 'practitioner')) {
      navigate('/doctor-login');
    }
  }, [user, navigate]);

  const stats = getPatientStats();

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.personalInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.personalInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || patient.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDeletePatient = async (patientId) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await deletePatient(patientId);
      } catch (error) {
        console.error('Error deleting patient:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Follow-up': return 'bg-yellow-100 text-yellow-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      case 'Discharged': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDoshaColor = (dosha) => {
    switch (dosha) {
      case 'Vata': return 'dosha-vata';
      case 'Pitta': return 'dosha-pitta';
      case 'Kapha': return 'dosha-kapha';
      default: return 'bg-gray-200';
    }
  };

  const quickStats = [
    {
      title: 'Total Patients',
      value: stats.totalPatients || 0,
      icon: <Users className="w-6 h-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Active Patients',
      value: stats.activePatients || 0,
      icon: <Activity className="w-6 h-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Follow-ups',
      value: stats.followUpPatients || 0,
      icon: <Clock className="w-6 h-6" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'This Month',
      value: stats.consultationsThisMonth || 0,
      icon: <Calendar className="w-6 h-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen ayur-page">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center shadow-lg transform rotate-6">
                    <Stethoscope className="h-5 w-5 text-white transform -rotate-6" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                    <Zap className="h-2 w-2 text-white" />
                  </div>
                </div>
                <span className="ml-3 text-2xl font-black bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AiAyush
                </span>
                <span className="ml-2 text-sm font-medium text-gray-500">
                  | Dashboard
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Settings className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.specialization || 'Ayurvedic Physician'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="inline-block px-3 py-1 bg-gradient-to-r from-ayurvedic.green/10 to-ayurvedic.blue/10 rounded-full text-xs font-semibold text-ayurvedic.green border border-ayurvedic.green/20">
              🤖 AI-Powered
            </div>
          </div>
          <h1 className="text-4xl font-bold ayur-title mb-2">
            Welcome back, {user.name}
          </h1>
          <p className="text-gray-600 text-lg">
            ✨ Manage your patients with AI-powered Ayurvedic intelligence
          </p>
        </motion.div>

        {/* Quick Stats - Flowing Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {quickStats.map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -4 }}
                className="text-center group cursor-pointer"
              >
                <div className="relative">
                  <div className={`w-16 h-16 mx-auto rounded-full ${stat.bgColor} ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    {stat.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full" style={{background:'var(--ayur-gold)'}}></div>
                </div>
                <h3 className="text-3xl font-bold ayur-title mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions - Modern Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold ayur-title mb-8">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link to="/add-patient" className="group">
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                className="relative overflow-hidden rounded-3xl p-8 transition-all duration-300"
                style={{background: 'linear-gradient(135deg, var(--card-bg-soft) 0%, var(--card-bg) 100%)'}}
              >
                <div className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center" style={{background:'var(--ayur-herbal)'}}>
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div className="pt-4">
                  <h3 className="text-xl font-bold ayur-title mb-3">Add New Patient</h3>
                  <p className="text-gray-600 leading-relaxed">Register a new patient with AI assistance and comprehensive health profiling</p>
                </div>
                <div className="mt-6 flex items-center text-sm font-medium" style={{color:'var(--ayur-herbal)'}}>
                  Start Registration
                  <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            </Link>

            <Link to="/chatbot" className="group">
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                className="relative overflow-hidden rounded-3xl p-8 transition-all duration-300"
                style={{background: 'linear-gradient(135deg, var(--card-bg-soft) 0%, var(--card-bg) 100%)'}}
              >
                <div className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center" style={{background:'var(--ayur-deep-teal)'}}>
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div className="pt-4">
                  <h3 className="text-xl font-bold ayur-title mb-3">AI Assistant</h3>
                  <p className="text-gray-600 leading-relaxed">Get Ayurvedic guidance and personalized recommendations for your patients</p>
                </div>
                <div className="mt-6 flex items-center text-sm font-medium" style={{color:'var(--ayur-deep-teal)'}}>
                  Open Assistant
                  <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            </Link>

            <Link to="/diet-generator" className="group">
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                className="relative overflow-hidden rounded-3xl p-8 transition-all duration-300"
                style={{background: 'linear-gradient(135deg, var(--card-bg-soft) 0%, var(--card-bg) 100%)'}}
              >
                <div className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center" style={{background:'var(--ayur-gold)'}}>
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div className="pt-4">
                  <h3 className="text-xl font-bold ayur-title mb-3">Diet Generator</h3>
                  <p className="text-gray-600 leading-relaxed">Create personalized Ayurvedic diet plans based on dosha and health conditions</p>
                </div>
                <div className="mt-6 flex items-center text-sm font-medium" style={{color:'var(--ayur-gold)'}}>
                  Generate Plan
                  <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            </Link>
          </div>
        </motion.div>

        {/* Patient Management - Clean Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="rounded-3xl overflow-hidden"
          style={{background: 'var(--card-bg)', border: '1px solid var(--border-soft)'}}
        >
          <div className="p-8 border-b" style={{borderColor: 'var(--border-soft)'}}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold ayur-title mb-2">Patient Management</h2>
                <p className="text-gray-600">Track and manage your patient records</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative mt-4 sm:mt-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[var(--ayur-deep-teal)] focus:border-transparent bg-gray-50"
                    style={{borderColor: 'var(--border-soft)'}}
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[var(--ayur-deep-teal)] focus:border-transparent bg-gray-50"
                  style={{borderColor: 'var(--border-soft)'}}
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Discharged">Discharged</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredPatients.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterStatus !== 'All' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Get started by adding your first patient'
                  }
                </p>
                <Link
                  to="/add-patient"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl ayur-cta-btn transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Patient
                </Link>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dosha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Visit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPatients.map((patient) => (
                    <tr key={patient._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-ayurvedic.green flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {patient.personalInfo?.name?.charAt(0) || 'P'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {patient.personalInfo?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {patient.personalInfo?.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDoshaColor(patient.healthProfile?.prakriti)}`}>
                          {patient.healthProfile?.prakriti || 'Not assessed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(patient.status)}`}>
                          {patient.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.updatedAt ? new Date(patient.updatedAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            to={`/diet-plan/${patient._id}`}
                            className="text-purple-600 hover:text-purple-800 transition-colors"
                            title="View Diet Plan"
                          >
                            Plan
                          </Link>
                          <button
                            className="text-ayurvedic.green hover:text-green-600 transition-colors"
                            title="View Patient"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Edit Patient"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePatient(patient._id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete Patient"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
