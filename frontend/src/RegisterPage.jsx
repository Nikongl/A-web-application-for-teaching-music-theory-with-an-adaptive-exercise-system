import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AuthPages.css';

const RegisterPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password1 !== password2) {
      setError('Пароли не совпадают');
      return;
    }
    if (password1.length < 8) {
      setError('Пароль должен быть не менее 8 символов');
      return;
    }
    setLoading(true);
    try {
      // Отправляем регистрацию
      const response = await axios.post('/auth/registration/', {
        username,
        email,
        password1,
        password2,
      });
      const { access, refresh } = response.data;
      // Сохраняем токены
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      // Получаем данные пользователя
      const userResponse = await axios.get('/auth/user/', {
        headers: { Authorization: `Bearer ${access}` }
      });
      onLogin(userResponse.data);
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.username?.[0] || data?.email?.[0] || data?.password1?.[0] || 'Ошибка регистрации';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Регистрация</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input type="text" placeholder="Имя пользователя" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="form-group">
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <input type="password" placeholder="Пароль (минимум 8 символов)" value={password1} onChange={(e) => setPassword1(e.target.value)} required />
          </div>
          <div className="form-group">
            <input type="password" placeholder="Подтвердите пароль" value={password2} onChange={(e) => setPassword2(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className="auth-button-primary">
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        <div className="auth-links">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;