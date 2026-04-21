import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './GalleryPage.css';

const GalleryPage = () => {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState([]);
  const [filteredConfigs, setFilteredConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [exerciseTypes, setExerciseTypes] = useState([]);
  const [difficulties, setDifficulties] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [configsRes, typesRes, difficultiesRes] = await Promise.all([
          axios.get('/api/public-configs/'),
          axios.get('/api/exercise-types/'),
          axios.get('/api/difficulties/')
        ]);
        setConfigs(configsRes.data);
        setFilteredConfigs(configsRes.data);
        setExerciseTypes(typesRes.data);
        setDifficulties(difficultiesRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...configs];
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.creator_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (typeFilter) {
      filtered = filtered.filter(c => c.exercise_types.some(t => t.id === parseInt(typeFilter)));
    }
    if (difficultyFilter) {
      filtered = filtered.filter(c => c.difficulty === parseInt(difficultyFilter));
    }
    setFilteredConfigs(filtered);
  }, [searchTerm, typeFilter, difficultyFilter, configs]);

  const startExercise = (configId) => {
    navigate(`/exercise/${configId}`);
  };

  return (
    <div className="gallery-container">
      <h1><i className="fas fa-globe"></i> Галерея тренажёров</h1>
      <p>Тренажёры, созданные другими пользователями</p>

      <div className="filters">
        <input 
          type="text" 
          placeholder="🔍 Поиск по названию или автору..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">Все типы</option>
          {exerciseTypes.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
        </select>
        <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}>
          <option value="">Все сложности</option>
          {difficulties.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading"><i className="fas fa-spinner fa-spin"></i> Загрузка...</div>
      ) : filteredConfigs.length === 0 ? (
        <div className="empty"><i className="fas fa-folder-open"></i> Нет тренажёров по выбранным фильтрам</div>
      ) : (
        <div className="gallery-grid">
          {filteredConfigs.map(config => (
            <div key={config.id} className="gallery-card">
              <div className="card-header">
                <h3>{config.name}</h3>
                <span className="difficulty-badge" style={{ backgroundColor: config.difficulty_color || '#58cc71' }}>
                  {config.difficulty_name}
                </span>
              </div>
              <p className="card-description">{config.description || 'Нет описания'}</p>
              <div className="card-meta">
                <span><i className="fas fa-user"></i> {config.creator_name}</span>
                <span><i className="fas fa-list"></i> {config.questions_per_session} заданий</span>
              </div>
              <div className="card-types">
                {config.exercise_types.map(t => <span key={t.id} className="type-tag">{t.icon} {t.name}</span>)}
              </div>
              <button className="start-btn" onClick={() => startExercise(config.id)}>
                <i className="fas fa-play"></i> Начать тренировку
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Нижняя навигация */}
      <nav className="bottom-nav">
        <button className="nav-icon" onClick={() => navigate('/')}>
          <i className="fas fa-home"></i>
        </button>
        <button className="nav-icon" onClick={() => navigate('/statistics')}>
          <i className="fas fa-chart-line"></i>
        </button>
        <button className="nav-icon active" onClick={() => navigate('/gallery')}>
          <i className="fas fa-images"></i>
        </button>
        <button className="nav-icon" onClick={() => navigate('/profile')}>
          <i className="fas fa-user"></i>
        </button>
      </nav>
    </div>
  );
};

export default GalleryPage;