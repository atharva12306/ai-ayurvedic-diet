import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const PatientContext = createContext();

export const usePatients = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatients must be used within a PatientProvider');
  }
  return context;
};

export const PatientProvider = ({ children }) => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);

  // Demo auth helper: ensures there's a token by registering/logging in a demo practitioner
  const ensureAuth = async () => {
    try {
      await axios.get('/api/auth/verify');
      return true;
    } catch (_) {
      const demo = {
        name: 'Demo Practitioner',
        email: 'demo.practitioner@example.com',
        password: 'demopass123',
        role: 'practitioner',
        specialization: 'Ayurveda'
      };
      try {
        const reg = await axios.post('/api/auth/register', demo);
        const token = reg.data?.token;
        if (token) {
          localStorage.setItem('token', token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          return true;
        }
      } catch (_) {
        try {
          const loginRes = await axios.post('/api/auth/login', {
            email: demo.email,
            password: demo.password
          });
          const token = loginRes.data?.token;
          if (token) {
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            return true;
          }
        } catch (loginErr) {
          console.error('Demo auth failed:', loginErr);
          return false;
        }
      }
      return false;
    }
  };

  // Load patients from backend on mount
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        let response;
        try {
          response = await axios.get('/api/patients');
        } catch (err) {
          if (err?.response?.status === 401) {
            const ok = await ensureAuth();
            if (ok) {
              response = await axios.get('/api/patients');
            } else {
              throw err;
            }
          } else {
            throw err;
          }
        }
        // Server returns { patients, totalPages, currentPage, total }
        setPatients(response.data?.patients || []);
      } catch (error) {
        // Optional: handle error (e.g., toast)
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const addPatient = async (patientData) => {
    try {
      setLoading(true);
      let response;
      try {
        response = await axios.post('/api/patients', patientData);
      } catch (err) {
        if (err?.response?.status === 401) {
          const ok = await ensureAuth();
          if (ok) {
            response = await axios.post('/api/patients', patientData);
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }
      const newPatient = response.data?.patient || null;
      if (newPatient) {
        setPatients(prev => [...prev, newPatient]);
      }
      return { success: true, patient: newPatient };
    } catch (error) {
      // Build a detailed error message from server response
      console.error('Add patient error:', error);
      console.error('Error response:', error.response?.data);
      const baseMsg = error.response?.data?.message || 'Failed to add patient';
      const errors = error.response?.data?.errors;
      let details = '';
      if (Array.isArray(errors) && errors.length) {
        const items = errors.map(e => `${e.path || e.param || 'field'}: ${e.msg || e.message || 'invalid'}`);
        details = `\nDetails: ${items.join('; ')}`;
      }
      return { 
        success: false, 
        error: `${baseMsg}${details}`
      };
    } finally {
      setLoading(false);
    }
  };

  const updatePatient = async (patientId, patientData) => {
    try {
      setLoading(true);
      const response = await axios.put(`/api/patients/${patientId}`, patientData);
      const updatedPatient = response.data?.patient || null;
      setPatients(prev => 
        prev.map(patient => (patient._id === patientId ? updatedPatient : patient))
      );
      return { success: true, patient: updatedPatient };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update patient' 
      };
    } finally {
      setLoading(false);
    }
  };

  const deletePatient = async (patientId) => {
    try {
      setLoading(true);
      await axios.delete(`/api/patients/${patientId}`);
      setPatients(prev => prev.filter(patient => patient._id !== patientId));
      if (selectedPatient?._id === patientId) {
        setSelectedPatient(null);
      }
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to delete patient' 
      };
    } finally {
      setLoading(false);
    }
  };

  const getPatientStats = () => {
    const totalPatients = patients.length;
    const activePatients = patients.filter(p => p.status === 'Active').length;
    const followUpPatients = patients.filter(p => p.status === 'Follow-up').length;
    // For now, consultationsThisMonth requires appointment data; default to 0
    const consultationsThisMonth = 0;

    return {
      totalPatients,
      activePatients,
      followUpPatients,
      consultationsThisMonth
    };
  };

  const value = {
    patients,
    selectedPatient,
    setSelectedPatient,
    addPatient,
    updatePatient,
    deletePatient,
    getPatientStats,
    loading
  };

  return (
    <PatientContext.Provider value={value}>
      {children}
    </PatientContext.Provider>
  );
};






