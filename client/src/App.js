import React from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './components/Homepage';
import Dashboard from './components/Dashboard';
import DietGenerator from './components/DietGenerator';
import FoodDatabase from './components/FoodDatabase';
import Chatbot from './components/Chatbot';
import DoctorLogin from './components/DoctorLogin';
import DoctorDashboard from './components/DoctorDashboard';
import PatientRegistration from './components/PatientRegistration';
import DietPlanDetail from './components/DietPlanDetail';
import DietPreferences from './components/DietPreferences';

import { AuthProvider } from './contexts/AuthContext';
import { PatientProvider } from './contexts/PatientContext';
import { FoodProvider } from './contexts/FoodContext';

function App() {
  return (
    <AuthProvider>
      <PatientProvider>
        <FoodProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/diet-generator" element={<DietGenerator />} />
                <Route path="/food-database" element={<FoodDatabase />} />
                <Route path="/chatbot" element={<Chatbot />} />
                <Route path="/doctor-login" element={<DoctorLogin />} />
                <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
                <Route path="/add-patient" element={<PatientRegistration />} />
                <Route path="/diet-preferences" element={<DietPreferences />} />
                <Route path="/diet-plan/:patientId" element={<DietPlanDetail />} />
              </Routes>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: { background: '#363636', color: '#fff' },
                  success: { duration: 3000, iconTheme: { primary: '#10b981', secondary: '#fff' } },
                  error: { duration: 5000, iconTheme: { primary: '#ef4444', secondary: '#fff' } }
                }}
              />
            </div>
          </Router>
        </FoodProvider>
      </PatientProvider>
    </AuthProvider>
  );
}

export default App;



