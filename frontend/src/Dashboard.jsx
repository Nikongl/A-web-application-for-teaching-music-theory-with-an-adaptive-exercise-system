import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [createdExercises, setCreatedExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchMyConfigs = async () => {
    if (!user) return;
    console.log('User object in Dashboard:', user); // должен быть id
    try {
      const response = await axios.get('/api/configs/');
      console.log('All configs from API:', response.data);
      // Фильтруем по creator (число)
      const myConfigs = response.data.filter(cfg => cfg.creator === user.pk);
      // const myConfigs = response.data;
      console.log('User pk:', user.pk);
      console.log('First config creator:', response.data[0]?.creator);
      console.log('Filtered my configs:', myConfigs);
      console.log('user.username:', user?.username);
      setCreatedExercises(myConfigs);
    } catch (err) {
      console.error('Error fetching configs:', err);
    } finally {
      setLoading(false);
    }
  };
  fetchMyConfigs();
}, [user]);

  const userData = {
    name: user?.username || user?.email?.split('@')[0] || 'Гость',
    level: user?.level || 1,
    xp: user?.experience_points || 0,
    nextLevelXp: 100,
    streak: user?.streak || 0,
    lastExercises: user?.lastExercises || [],
  };
  const xpPercent = (userData.xp / userData.nextLevelXp) * 100;
  console.log('Rendering, createdExercises length:', createdExercises.length);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="user-greeting">
          <h1>Привет, {userData.name}! 👋</h1>
          <p>Уровень {userData.level} • Серия: {userData.streak} дней 🔥</p>
          <button onClick={onLogout} className="logout-btn">🚪 Выйти</button>
        </div>
        <div className="xp-card">
          <div className="xp-label"><span>Опыт</span><span>{userData.xp} / {userData.nextLevelXp} XP</span></div>
          <div className="xp-bar"><div className="xp-fill" style={{ width: `${xpPercent}%` }}></div></div>
        </div>
      </div>
      <div className="continue-card">
        <button className="continue-btn" onClick={() => navigate('/exercise')}>🚀 Продолжить обучение</button>
        <p>Пройди тренировку, чтобы не терять серию</p>
      </div>
      <section className="dashboard-section">
        <h2>📚 Недавние тренировки</h2>
        <div className="cards-grid">
          {userData.lastExercises.length === 0 ? <div className="exercise-card">Нет завершённых тренировок</div> :
            userData.lastExercises.map(ex => (
              <div key={ex.id} className="exercise-card">
                <h3>{ex.title}</h3>
                <div className="card-meta"><span className="type-badge">{ex.type === 'interval' ? '🎵 Интервалы' : '🎹 Аккорды'}</span><span>{ex.tasks} заданий</span></div>
                <div className="progress-card-bar"><div className="progress-card-fill" style={{ width: `${ex.progress}%` }}></div></div>
                <button className="card-btn" onClick={() => navigate('/exercise')}>Продолжить →</button>
              </div>
            ))
          }
        </div>
      </section>
      <section className="dashboard-section">
        <h2>🛠 Мои тренажёры</h2>
        <div className="cards-grid">
          {loading ? <div className="exercise-card">Загрузка...</div> :
            createdExercises.length === 0 ? <div className="exercise-card">Вы ещё не создали ни одного тренажёра</div> :
            createdExercises.map(ex => (
              <div key={ex.id} className="exercise-card created-card">
                <h3>{ex.name}</h3>
                <div className="card-meta"><span className="type-badge">{ex.exercise_type_name}</span><span>{ex.questions_per_session} заданий</span></div>
                {/* <button className="card-btn secondary" onClick={() => navigate('/constructor')}>Редактировать ✏️</button> */}
                <button className="card-btn secondary" onClick={() => navigate(`/exercise/${ex.id}`)}>▶️ Начать</button>
              </div>
            ))
          }
          <div className="exercise-card add-card" onClick={() => navigate('/constructor')}>
            <div className="add-icon">+</div>
            <p>Создать новый тренажёр</p>
          </div>
        </div>
      </section>
      <nav className="bottom-nav">
        <button className="nav-btn active" onClick={() => navigate('/')}>🏠 Главная</button>
        <button className="nav-btn" onClick={() => navigate('/statistics')}>📊 Статистика</button>
        <button className="nav-btn" onClick={() => navigate('/gallery')}>🌍 Галерея</button>
        <button className="nav-btn" onClick={() => navigate('/profile')}>👤 Профиль</button>
      </nav>
    </div>
  );
};

export default Dashboard;