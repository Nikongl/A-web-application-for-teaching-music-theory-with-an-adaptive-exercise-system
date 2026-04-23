import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTour } from './TourContext';
import './Dashboard.css';

const Dashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const { startTour } = useTour();
  const [user, setUser] = useState(null);
  const [createdExercises, setCreatedExercises] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [adaptiveMode, setAdaptiveMode] = useState(() => {
    const saved = localStorage.getItem('adaptiveMode');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleAdaptiveMode = () => {
    const newMode = !adaptiveMode;
    setAdaptiveMode(newMode);
    localStorage.setItem('adaptiveMode', newMode);
  };

  const isAdmin = user?.email === 'glnikov@gmail.com' || user?.email === 'admin2@example.com';

  const handleDelete = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить этот тренажёр?')) {
      try {
        await axios.delete(`/api/configs/${id}/`);
        setCreatedExercises(prev => prev.filter(ex => ex.id !== id));
      } catch (err) {
        console.error('Ошибка удаления', err);
        alert('Не удалось удалить тренажёр');
      }
    }
  };

  const fetchUserData = async () => {
    try {
      const res = await axios.get('/api/user-profile/');
      setUser(res.data);
      return res.data;
    } catch (err) {
      console.error('Ошибка загрузки профиля:', err);
      return null;
    }
  };

  const fetchRecentSessions = async () => {
    try {
      const res = await axios.get('/api/sessions/');
      const completed = res.data
        .filter(s => s.status === 'completed')
        .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
        .slice(0, 3);
      setRecentSessions(completed);
    } catch (err) {
      console.error('Ошибка загрузки сессий', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const userData = await fetchUserData();
      if (userData) {
        try {
          const configsRes = await axios.get('/api/configs/');
          let myConfigs;
          if (userData.id) {
            myConfigs = configsRes.data.filter(cfg => cfg.creator === userData.id);
          } else {
            myConfigs = configsRes.data.filter(cfg => cfg.creator_name === userData.username);
          }
          setCreatedExercises(myConfigs);
          await fetchRecentSessions();
        } catch (err) {
          console.error(err);
        }
      }
      setLoading(false);
    };
    loadData();
  }, []);

  // Запуск тура с привязкой к ID пользователя
  // ... остальной код до useEffect с запуском тура по флагу

  // Запуск тура по параметру URL (из профиля)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tour') === '1' && user && !loading) {
      window.history.replaceState({}, document.title, window.location.pathname);
      const steps = [
        { page: '/', selector: null, title: '👋 Добро пожаловать!', text: 'Давайте познакомимся с приложением. Нажмите "Далее".', interactive: false },
        { page: '/', selector: '.xp-card', title: '📈 Ваш прогресс', text: 'Здесь отображаются ваш уровень и опыт (XP). Проходя тренировки, вы получаете XP и повышаете уровень.', interactive: false },
        { page: '/', selector: '.add-card', title: '➕ Создание тренажёра', text: 'Нажмите на эту карточку, чтобы создать новый тренажёр. Мы перейдём в конструктор.', interactive: true },
        { page: '/constructor', selector: '.form-group:first-child input', title: '📝 Название тренажёра', text: 'Введите название, например "Мои первые ноты". Затем нажмите "Далее".', interactive: false },
        { page: '/constructor', selector: '.checkbox-label:first-child input', title: '🎵 Выбор типа упражнения', text: 'Нажмите на один из чекбоксов, чтобы выбрать тип упражнения (ноты, интервалы или аккорды).', interactive: true },
        { page: '/constructor', selector: '.btn-primary', title: '💾 Сохранение тренажёра', text: 'После настройки нажмите на зелёную кнопку "Создать тренажёр", чтобы сохранить.', interactive: true },
        { page: '/', selector: '.continue-btn', title: '🚀 Продолжить обучение', text: 'Теперь нажмите на главную кнопку, чтобы начать тренировку.', interactive: true },
        { page: '/statistics', selector: '.stats-grid', title: '📊 Статистика', text: 'Здесь вы видите точность по нотам, интервалам и аккордам. Нажмите "Далее".', interactive: false },
        { page: '/gallery', selector: '.gallery-grid', title: '🌍 Галерея', text: 'Публичные тренажёры других пользователей. Вы можете проходить их.', interactive: false },
        { page: '/profile', selector: '.achievements-section', title: '🏆 Достижения', text: 'Ваши достижения и прогресс.', interactive: false },
        { page: '/profile', selector: '.edit-profile-btn', title: '✏️ Редактирование профиля', text: 'Нажмите на кнопку "Редактировать профиль", чтобы изменить имя, фото или информацию о себе.', interactive: true },
        { page: '/', selector: null, title: '✨ Готово!', text: 'Теперь вы знаете всё. Приятного обучения!', interactive: false },
      ];
      startTour(steps);
    }
  }, [loading, user, startTour]);

  const continueLearning = () => {
    if (createdExercises.length > 0) {
      navigate(`/exercise/${createdExercises[0].id}`);
    } else {
      navigate('/constructor');
    }
  };

  const goToProfile = () => {
    navigate('/profile');
  };

  if (loading || !user) return <div className="dashboard-container">Загрузка...</div>;

  const userData = {
    name: user.username || user.email?.split('@')[0] || 'Гость',
    level: user.level || 1,
    xp: user.experience_points || 0,
    streak: user.streak || 0,
  };

  const xpForCurrentLevel = userData.xp % 100;
  const xpNeededForNext = 100 - xpForCurrentLevel;
  const progressPercent = (xpForCurrentLevel / 100) * 100;

  return (
    <div className="dashboard-container">
      {/* Верхняя карточка пользователя */}
      <div className="user-card">
        <div className="user-info" onClick={goToProfile} style={{ cursor: 'pointer' }}>
          <div className="avatar-icon">
            <i className="fas fa-user-circle"></i>
          </div>
          <div className="user-text">
            <h1>Привет, {userData.name}!</h1>
            <div className="user-stats">
              <span className="level-badge">
                <i className="fas fa-star"></i> Уровень {userData.level}
              </span>
            </div>
          </div>
        </div>
        <button onClick={onLogout} className="logout-btn">
          <i className="fas fa-sign-out-alt"></i>
        </button>
      </div>

      {/* XP прогресс */}
      <div className="xp-card">
        <div className="xp-header">
          <span><i className="fas fa-chart-simple"></i> Опыт</span>
          <span>{userData.xp}</span>
        </div>
        <div className="xp-bar">
          <div className="xp-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="xp-footer">
          До следующего уровня: {xpNeededForNext} XP
        </div>
      </div>

      {/* Главная кнопка */}
      <button className="continue-btn" onClick={continueLearning}>
        <i className="fas fa-play"></i> Продолжить обучение
      </button>

      {/* Недавние тренировки */}
      <section className="dashboard-section">
        <h2 className="section-title">
          <i className="fas fa-clock"></i> Недавние тренировки
        </h2>
        <div className="cards-list">
          {recentSessions.length === 0 ? (
            <div className="empty-card">
              <i className="fas fa-dumbbell"></i>
              <p>Нет завершённых тренировок</p>
            </div>
          ) : (
            recentSessions.map(session => (
              <div key={session.id} className="card">
                <div className="card-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="card-content">
                  <h3>{session.config_name || 'Тренировка'}</h3>
                  <div className="card-meta">
                    <span><i className="fas fa-check"></i> {session.correct_answers} / {session.answered_questions}</span>
                    <span><i className="fas fa-calendar"></i> {new Date(session.completed_at).toLocaleDateString()}</span>
                  </div>
                  <button className="card-btn repeat" onClick={() => navigate(`/exercise/${session.config}`)}>
                    <i className="fas fa-rotate-right"></i> Повторить
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Мои тренажёры */}
      <section className="dashboard-section">
        <h2 className="section-title">
          <i className="fas fa-cubes"></i> Мои тренажёры
        </h2>
        <div className="cards-list">
          {createdExercises.length === 0 ? (
            <div className="empty-card">
              <i className="fas fa-plus-circle"></i>
              <p>Вы ещё не создали ни одного тренажёра</p>
            </div>
          ) : (
            createdExercises.map(ex => (
              <div key={ex.id} className="card created-card">
                <div className="card-icon">
                  <i className="fas fa-puzzle-piece"></i>
                </div>
                <div className="card-content">
                  <h3>{ex.name}</h3>
                  <div className="card-meta">
                    <span className="type-badge">{ex.exercise_type_name}</span>
                    <span><i className="fas fa-list"></i> {ex.questions_per_session} заданий</span>
                  </div>
                  <div className="card-actions">
                    <button className="action-btn edit" onClick={() => navigate(`/constructor/${ex.id}`)}>
                      <i className="fas fa-pen"></i>
                    </button>
                    <button className="action-btn delete" onClick={() => handleDelete(ex.id)}>
                      <i className="fas fa-trash-alt"></i>
                    </button>
                    <button className="action-btn start" onClick={() => navigate(`/exercise/${ex.id}`)}>
                      <i className="fas fa-play"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
          <div className="add-card" onClick={() => navigate('/constructor')}>
            <i className="fas fa-plus-circle add-icon"></i>
            <p>Создать новый тренажёр</p>
          </div>
        </div>
      </section>

      {/* Нижняя навигация */}
      <nav className="bottom-nav">
        <button className="nav-icon active" onClick={() => navigate('/')}>
          <i className="fas fa-home"></i>
        </button>
        <button className="nav-icon" onClick={() => navigate('/statistics')}>
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

export default Dashboard;