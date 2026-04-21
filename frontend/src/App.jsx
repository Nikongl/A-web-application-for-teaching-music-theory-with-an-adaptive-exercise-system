import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import ExercisePage from './ExercisePage';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import axios from 'axios';
import ConstructorPage from './ConstructorPage';
import StatisticsPage from './StatisticsPage';
import GalleryPage from './GalleryPage';
import ProfilePage from './ProfilePage';
import EditProfilePage from './EditProfilePage';

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      axios.get('/auth/user/')
        .then(response => {
          setIsAuthenticated(true);
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setIsAuthenticated(false);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await axios.get('/auth/user/');
      setUser(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/register" element={<RegisterPage onLogin={handleLogin} />} />
        <Route path="/" element={isAuthenticated ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/exercise/:id" element={isAuthenticated ? <ExercisePage onRefreshUser={refreshUser} onBack={() => window.history.back()} /> : <Navigate to="/login" />} />
        <Route path="/constructor" element={isAuthenticated ? <ConstructorPage /> : <Navigate to="/login" />} />
        <Route path="/statistics" element={isAuthenticated ? <StatisticsPage /> : <Navigate to="/login" />} />
        <Route path="/gallery" element={isAuthenticated ? <GalleryPage /> : <Navigate to="/login" />} />
        <Route path="/profile" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/edit-profile" element={isAuthenticated ? <EditProfilePage /> : <Navigate to="/login" />} />
        <Route path="/constructor/:id" element={isAuthenticated ? <ConstructorPage /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;