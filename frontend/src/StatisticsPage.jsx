import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StatisticsPage.css';

const StatisticsPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/user-detailed-statistics/');
        setStats(response.data);
      } catch (err) {
        setError('Не удалось загрузить статистику');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="stats-container">Загрузка...</div>;
  if (error) return <div className="stats-container">{error}</div>;
  if (!stats) return null;

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 80) return '#4CAF50';
    if (accuracy >= 50) return '#ff9800';
    return '#f44336';
  };

  return (
    <div className="stats-container">
      <div className="stats-header">
        <h1><i className="fas fa-chart-line"></i> Статистика</h1>
        <p>Твой прогресс в музыке</p>
      </div>

      {/* Карточки метрик */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-dumbbell"></i></div>
          <div className="stat-value">{stats.total_sessions}</div>
          <div className="stat-label">тренировок</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-bullseye"></i></div>
          <div className="stat-value">{stats.overall_accuracy}%</div>
          <div className="stat-label">точность</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-star"></i></div>
          <div className="stat-value">{stats.user_level}</div>
          <div className="stat-label">уровень</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-gem"></i></div>
          <div className="stat-value">{stats.experience_points}</div>
          <div className="stat-label">опыта</div>
        </div>
      </div>

      {/* Таблица нот */}
      <div className="stats-panel">
        <div className="panel-header">
          <i className="fas fa-music"></i> Ноты
        </div>
        <div className="table-wrapper">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Нота</th>
                <th>Точность</th>
                <th>✅</th>
                <th>❌</th>
                <th>Всего</th>
              </tr>
            </thead>
            <tbody>
              {stats.weak_notes.map((item, idx) => (
                <tr key={idx}>
                  <td className="note-name">{item.name}</td>
                  <td className="progress-cell">
                    <div className="progress-bar-container">
                      <div className="progress-bar-bg">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${item.accuracy}%`, backgroundColor: getAccuracyColor(item.accuracy) }}
                        />
                      </div>
                      <span className="progress-percent">{item.accuracy}%</span>
                    </div>
                  </td>
                  <td className="correct-count">{item.correct}</td>
                  <td className="wrong-count">{item.wrong}</td>
                  <td className="total-count">{item.attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Интервалы и аккорды в два столбца */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '28px' }}>
        <div className="stats-panel" style={{ flex: 1, minWidth: '250px' }}>
          <div className="panel-header">
            <i className="fas fa-chart-line"></i> Интервалы
          </div>
          {stats.weak_intervals.length === 0 ? (
            <div className="empty-state">Нет данных по интервалам</div>
          ) : (
            <div className="items-list">
              {stats.weak_intervals.map((item, idx) => (
                <div key={idx} className="stat-item">
                  <div className="item-header">
                    <span>{item.name}</span>
                    <span className="item-accuracy" style={{ color: getAccuracyColor(item.accuracy) }}>
                      {item.accuracy}%
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-bg">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${item.accuracy}%`, backgroundColor: getAccuracyColor(item.accuracy) }}
                      />
                    </div>
                  </div>
                  <div className="item-stats">
                    <span><i className="fas fa-check-circle"></i> {item.correct}</span>
                    <span><i className="fas fa-times-circle"></i> {item.wrong}</span>
                    <span><i className="fas fa-chart-simple"></i> {item.attempts}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="stats-panel" style={{ flex: 1, minWidth: '250px' }}>
          <div className="panel-header">
            <i className="fas fa-chord"></i> Аккорды
          </div>
          {stats.weak_chords.length === 0 ? (
            <div className="empty-state">Нет данных по аккордам</div>
          ) : (
            <div className="items-list">
              {stats.weak_chords.map((item, idx) => (
                <div key={idx} className="stat-item">
                  <div className="item-header">
                    <span>{item.name}</span>
                    <span className="item-accuracy" style={{ color: getAccuracyColor(item.accuracy) }}>
                      {item.accuracy}%
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-bg">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${item.accuracy}%`, backgroundColor: getAccuracyColor(item.accuracy) }}
                      />
                    </div>
                  </div>
                  <div className="item-stats">
                    <span><i className="fas fa-check-circle"></i> {item.correct}</span>
                    <span><i className="fas fa-times-circle"></i> {item.wrong}</span>
                    <span><i className="fas fa-chart-simple"></i> {item.attempts}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Нижняя навигация */}
      <nav className="bottom-nav">
        <button className="nav-icon" onClick={() => navigate('/')}>
          <i className="fas fa-home"></i>
        </button>
        <button className="nav-icon active" onClick={() => navigate('/statistics')}>
          <i className="fas fa-chart-line"></i>
        </button>
        <button className="nav-icon" onClick={() => navigate('/gallery')}>
          <i className="fas fa-images"></i>
        </button>
        <button className="nav-icon" onClick={() => navigate('/profile')}>
          <i className="fas fa-user"></i>
        </button>
      </nav>
    </div>
  );
};

export default StatisticsPage;