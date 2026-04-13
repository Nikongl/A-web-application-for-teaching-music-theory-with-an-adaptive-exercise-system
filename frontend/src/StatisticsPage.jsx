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
  if (error) return <div className="stats-container error">{error}</div>;
  if (!stats) return null;

  return (
    <div className="stats-container">
      <button className="back-button" onClick={() => navigate('/')}>← Назад</button>
      <h1>📊 Моя статистика</h1>

      <div className="stats-summary">
        <div className="stat-card"><h3>🎯 Тренировок</h3><p>{stats.total_sessions}</p></div>
        <div className="stat-card"><h3>✅ Точность</h3><p>{stats.overall_accuracy}%</p></div>
        <div className="stat-card"><h3>📈 Уровень</h3><p>{stats.user_level}</p></div>
        <div className="stat-card"><h3>⚡ Опыт</h3><p>{stats.experience_points}</p></div>
      </div>

      <div className="weak-section">
        <h2>🎵 Слабые ноты</h2>
        {stats.weak_notes.length === 0 ? <p>Нет данных</p> : (
          <ul>
            {stats.weak_notes.map((item, idx) => (
              <li key={idx}><strong>{item.name}</strong> — точность {item.accuracy}% ({item.attempts} попыток)</li>
            ))}
          </ul>
        )}
      </div>

      <div className="weak-section">
        <h2>🎼 Слабые интервалы</h2>
        {stats.weak_intervals.length === 0 ? <p>Нет данных</p> : (
          <ul>
            {stats.weak_intervals.map((item, idx) => (
              <li key={idx}><strong>{item.name}</strong> — точность {item.accuracy}% ({item.attempts} попыток)</li>
            ))}
          </ul>
        )}
      </div>

      <div className="weak-section">
        <h2>🎹 Слабые аккорды</h2>
        {stats.weak_chords.length === 0 ? <p>Нет данных</p> : (
          <ul>
            {stats.weak_chords.map((item, idx) => (
              <li key={idx}><strong>{item.name}</strong> — точность {item.accuracy}% ({item.attempts} попыток)</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StatisticsPage;