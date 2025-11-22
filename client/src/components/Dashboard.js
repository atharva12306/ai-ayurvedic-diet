import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Heart,
  Activity,
  Star,
  ChevronRight,
  Bell,
  Settings
} from 'lucide-react';
import { usePatients } from '../contexts/PatientContext';

const Dashboard = () => {
  const { patients, selectedPatient, setSelectedPatient, getPatientStats } = usePatients();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showPatientModal, setShowPatientModal] = useState(false);

  const stats = getPatientStats();

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || patient.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Follow-up': return 'bg-yellow-100 text-yellow-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
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
      value: stats.totalPatients,
      icon: <Users className="w-6 h-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Active Patients',
      value: stats.activePatients,
      icon: <Activity className="w-6 h-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Follow-ups',
      value: stats.followUpPatients,
      icon: <Clock className="w-6 h-6" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'This Month',
      value: stats.consultationsThisMonth,
      icon: <Calendar className="w-6 h-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  const recentActivities = [
    { id: 1, patient: 'Priya Sharma', action: 'Diet plan updated', time: '2 hours ago', type: 'diet' },
    { id: 2, patient: 'Rajesh Kumar', action: 'New consultation scheduled', time: '4 hours ago', type: 'appointment' },
    { id: 3, patient: 'Anita Patel', action: 'Progress report generated', time: '6 hours ago', type: 'report' },
    { id: 4, patient: 'Vikram Singh', action: 'Follow-up reminder sent', time: '1 day ago', type: 'reminder' }
  ];

  return (
    <div className="min-h-screen bg-health.light">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-health.dark">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-ayurvedic.green">
                <Bell className="w-6 h-6" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 text-gray-600 hover:text-ayurvedic.green">
                <Settings className="w-6 h-6" />
              </button>
              <div className="w-8 h-8 bg-ayurvedic.green rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">DR</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="stats-card p-6 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-health.dark">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor} ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient Management */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-health.dark">Patient Management</h2>
                  <button className="bg-ayurvedic.green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Patient
                  </button>
                </div>
                
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search patients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ayurvedic.green focus:border-transparent"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ayurvedic.green focus:border-transparent"
                  >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Patient Cards */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPatients.map((patient) => (
                    <motion.div
                      key={patient.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className={`medical-card p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedPatient?.id === patient.id ? 'ring-2 ring-ayurvedic.green' : ''
                      }`}
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <img
                            src={patient.avatar}
                            alt={patient.name}
                            className="w-12 h-12 rounded-full mr-3"
                          />
                          <div>
                            <h3 className="font-semibold text-health.dark">{patient.name}</h3>
                            <p className="text-sm text-gray-600">{patient.age} years, {patient.gender}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                          {patient.status}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-2" />
                          {patient.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          {patient.phone}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className={`px-2 py-1 rounded text-xs font-medium text-white ${getDoshaColor(patient.prakriti)}`}>
                          {patient.prakriti}
                        </div>
                        <div className="flex space-x-1">
                          <button className="p-1 text-gray-400 hover:text-ayurvedic.green">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-blue-600">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Patient Details */}
            {selectedPatient && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-sm border p-6"
              >
                <h3 className="text-lg font-semibold text-health.dark mb-4">Patient Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Health Conditions</label>
                    <div className="mt-1">
                      {selectedPatient.healthConditions.map((condition, index) => (
                        <span
                          key={index}
                          className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mr-2 mb-1"
                        >
                          {condition}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Lifestyle</label>
                    <p className="text-sm text-gray-800">{selectedPatient.lifestyle}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Last Consultation</label>
                    <p className="text-sm text-gray-800">{selectedPatient.lastConsultation}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Next Appointment</label>
                    <p className="text-sm text-gray-800">{selectedPatient.nextAppointment}</p>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Link
                      to="/diet-generator"
                      className="w-full bg-ayurvedic.green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center"
                    >
                      Generate Diet Plan
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-health.dark mb-4">Recent Activities</h3>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-ayurvedic.green rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">
                        <span className="font-medium">{activity.patient}</span> - {activity.action}
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-health.dark mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/diet-generator"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Heart className="w-5 h-5 text-ayurvedic.green mr-3" />
                  <span className="text-sm font-medium">Generate Diet Plan</span>
                </Link>
                <Link
                  to="/food-database"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Search className="w-5 h-5 text-ayurvedic.blue mr-3" />
                  <span className="text-sm font-medium">Browse Food Database</span>
                </Link>
                <Link
                  to="/reports"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <TrendingUp className="w-5 h-5 text-purple-600 mr-3" />
                  <span className="text-sm font-medium">View Reports</span>
                </Link>
                <Link
                  to="/chatbot"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Activity className="w-5 h-5 text-orange-600 mr-3" />
                  <span className="text-sm font-medium">AI Assistant</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;






