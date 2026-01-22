import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '@/App.css';
import { Toaster, toast } from 'sonner';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import EnquiriesPage from './pages/EnquiriesPage';
import QuotationsPage from './pages/QuotationsPage';
import OrdersPage from './pages/OrdersPage';
import LeadsPage from './pages/LeadsPage';
import ProjectsPage from './pages/ProjectsPage';
import InventoryPage from './pages/InventoryPage';
import FinancePage from './pages/FinancePage';
import PettyCashPage from './pages/PettyCashPage';
import AttendancePage from './pages/AttendancePage';
import TasksPage from './pages/TasksPage';
import BusinessAreasPage from './pages/BusinessAreasPage';
import ExecutiveDashboardPage from './pages/ExecutiveDashboardPage';
import VideoGenerationPage from './pages/VideoGenerationPage';
import ReportsPage from './pages/ReportsPage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('auth_token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone, pin) => {
    const response = await axios.post(`${API}/auth/login`, { phone, pin });
    localStorage.setItem('auth_token', response.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
    setUser({
      id: response.data.user_id,
      name: response.data.name,
      roles: response.data.roles
    });
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-serif">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <CustomersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/enquiries"
              element={
                <ProtectedRoute>
                  <EnquiriesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quotations"
              element={
                <ProtectedRoute>
                  <QuotationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute>
                  <FinancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/executive"
              element={
                <ProtectedRoute>
                  <ExecutiveDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/business-areas"
              element={
                <ProtectedRoute>
                  <BusinessAreasPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads"
              element={
                <ProtectedRoute>
                  <LeadsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <ProjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <InventoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance"
              element={
                <ProtectedRoute>
                  <FinancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/petty-cash"
              element={
                <ProtectedRoute>
                  <PettyCashPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute>
                  <AttendancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <TasksPage />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster position="top-right" richColors />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
