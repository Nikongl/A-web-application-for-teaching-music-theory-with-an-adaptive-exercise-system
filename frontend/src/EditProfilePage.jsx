import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProfilePage.css';

const EditProfilePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    avatar: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('/auth/user/');
        setFormData({
          username: res.data.username || '',
          bio: res.data.bio || '',
          avatar: res.data.avatar || ''
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.patch('/api/update-profile/', formData);
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка обновления');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <button className="back-button" onClick={() => navigate('/profile')}>← Назад</button>
      <div className="profile-header">
        <h1>Редактировать профиль</h1>
      </div>
      <form onSubmit={handleSubmit} className="edit-form">
        <div className="form-group">
          <label>Имя пользователя</label>
          <input type="text" name="username" value={formData.username} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>О себе</label>
          <textarea name="bio" rows="4" value={formData.bio} onChange={handleChange} placeholder="Расскажите о себе..." />
        </div>
        <div className="form-group">
          <label>URL аватара</label>
          <input type="url" name="avatar" value={formData.avatar} onChange={handleChange} placeholder="https://example.com/avatar.png" />
        </div>
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading} className="edit-profile-btn">
          {loading ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </form>
    </div>
  );
};

export default EditProfilePage;