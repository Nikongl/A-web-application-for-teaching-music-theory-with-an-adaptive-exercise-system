import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './StatisticsPage.css';

const StatisticsPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [expandedNotes, setExpandedNotes] = useState({});
  const [expandedChords, setExpandedChords] = useState({});

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

  // Группировка нот
  const noteGroups = {};
  stats.weak_notes.forEach(note => {
    const noteName = note.name.replace(/[0-9]/g, '');
    if (!noteGroups[noteName]) {
      noteGroups[noteName] = {
        name: noteName,
        items: [],
        totalCorrect: 0,
        totalAttempts: 0,
      };
    }
    noteGroups[noteName].items.push(note);
    noteGroups[noteName].totalCorrect += note.correct;
    noteGroups[noteName].totalAttempts += note.attempts;
  });
  
  Object.values(noteGroups).forEach(group => {
    group.accuracy = group.totalAttempts > 0 
      ? Math.round((group.totalCorrect / group.totalAttempts) * 100) 
      : 0;
    group.items.sort((a, b) => a.accuracy - b.accuracy);
  });
  const sortedNoteGroups = Object.values(noteGroups).sort((a, b) => a.accuracy - b.accuracy);

  // Группировка аккордов
  const chordGroups = {};
  const chordTypesOrder = ['Мажор', 'Минор', 'Увеличенный', 'Уменьшенный'];
  stats.weak_chords.forEach(chord => {
    const parts = chord.name.split(' ');
    const chordType = parts[parts.length - 1];
    const tonic = parts.slice(0, -1).join(' ');
    if (!tonic || tonic.trim() === '') return;
    if (!chordGroups[chordType]) {
      chordGroups[chordType] = {
        type: chordType,
        items: [],
        totalCorrect: 0,
        totalAttempts: 0,
      };
    }
    chordGroups[chordType].items.push({ ...chord, tonic });
    chordGroups[chordType].totalCorrect += chord.correct;
    chordGroups[chordType].totalAttempts += chord.attempts;
  });
  
  Object.values(chordGroups).forEach(group => {
    group.accuracy = group.totalAttempts > 0 
      ? Math.round((group.totalCorrect / group.totalAttempts) * 100) 
      : 0;
    group.items.sort((a, b) => a.accuracy - b.accuracy);
  });
  const sortedChordGroups = chordTypesOrder
    .filter(type => chordGroups[type])
    .map(type => chordGroups[type])
    .sort((a, b) => a.accuracy - b.accuracy);

  const toggleNoteGroup = (noteName) => {
    setExpandedNotes(prev => ({ ...prev, [noteName]: !prev[noteName] }));
  };

  const toggleChordGroup = (chordType) => {
    setExpandedChords(prev => ({ ...prev, [chordType]: !prev[chordType] }));
  };

  return (
    <div className="stats-container">
      <div className="stats-header">
        <h1><i className="fas fa-chart-line"></i> Статистика</h1>
        <p>Твой прогресс в музыке</p>
      </div>

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

      {/* НОТЫ */}
      <div className="stats-panel">
        <div className="panel-header">
          <i className="fas fa-music"></i> Ноты
        </div>
        {sortedNoteGroups.length === 0 ? (
          <div className="empty-state">Нет данных по нотам</div>
        ) : (
          <div className="accordion-list">
            {sortedNoteGroups.map(group => (
              <div key={group.name} className="accordion-item">
                <div className="accordion-header" onClick={() => toggleNoteGroup(group.name)}>
                  <div className="accordion-title">
                    <span className="item-name">{group.name}</span>
                    <span className="item-accuracy" style={{ color: getAccuracyColor(group.accuracy) }}>
                      {group.accuracy}%
                    </span>
                  </div>
                  <i className={`fas fa-chevron-${expandedNotes[group.name] ? 'up' : 'down'}`}></i>
                </div>
                {expandedNotes[group.name] && (
                  <div className="accordion-content">
                    <div className="items-list-compact">
                      {group.items.map((item, idx) => (
                        <div key={idx} className="stat-item-compact">
                          <div className="item-header-compact">
                            <span className="item-name note-octave">{item.name}</span>
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
                          <div className="item-stats-compact">
                            <span><i className="fas fa-check-circle"></i> {item.correct}</span>
                            <span><i className="fas fa-times-circle"></i> {item.wrong}</span>
                            <span><i className="fas fa-chart-simple"></i> {item.attempts}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ИНТЕРВАЛЫ */}
      <div className="stats-panel">
        <div className="panel-header">
          <i className="fas fa-chart-line"></i> Интервалы
        </div>
        {stats.weak_intervals.length === 0 ? (
          <div className="empty-state">Нет данных по интервалам</div>
        ) : (
          <div className="items-list">
            {stats.weak_intervals
              .sort((a, b) => a.accuracy - b.accuracy)
              .map((item, idx) => (
                <div key={idx} className="stat-item">
                  <div className="item-header">
                    <span className="item-name">{item.name}</span>
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

      {/* АККОРДЫ */}
      <div className="stats-panel">
        <div className="panel-header">
          <i className="fas fa-chord"></i> Аккорды
        </div>
        {sortedChordGroups.length === 0 ? (
          <div className="empty-state">Нет данных по аккордам</div>
        ) : (
          <div className="accordion-list">
            {sortedChordGroups.map(group => (
              <div key={group.type} className="accordion-item">
                <div className="accordion-header" onClick={() => toggleChordGroup(group.type)}>
                  <div className="accordion-title">
                    <span className="item-name">{group.type}</span>
                    <span className="item-accuracy" style={{ color: getAccuracyColor(group.accuracy) }}>
                      {group.accuracy}%
                    </span>
                  </div>
                  <i className={`fas fa-chevron-${expandedChords[group.type] ? 'up' : 'down'}`}></i>
                </div>
                {expandedChords[group.type] && (
                  <div className="accordion-content">
                    <div className="items-list-compact">
                      {group.items.map((item, idx) => (
                        <div key={idx} className="stat-item-compact">
                          <div className="item-header-compact">
                            <span className="item-name chord-tonic">{item.tonic}</span>
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
                          <div className="item-stats-compact">
                            <span><i className="fas fa-check-circle"></i> {item.correct}</span>
                            <span><i className="fas fa-times-circle"></i> {item.wrong}</span>
                            <span><i className="fas fa-chart-simple"></i> {item.attempts}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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