import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [myConfigs, setMyConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', bio: '', avatar: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userRes = await axios.get('/api/user-profile/');
        setUser(userRes.data);
        setEditForm({
          username: userRes.data.username || '',
          bio: userRes.data.bio || '',
          avatar: userRes.data.avatar || '',
        });
        const configsRes = await axios.get('/api/configs/');
        const ownConfigs = configsRes.data.filter(cfg => cfg.creator === userRes.data.id);
        setMyConfigs(ownConfigs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const res = await axios.get('/api/user-achievements/');
        setAchievements(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAchievements();
  }, []);

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const response = await axios.patch('/api/user-profile/', {
        username: editForm.username,
        bio: editForm.bio,
        avatar: editForm.avatar,
      });
      setUser(response.data);
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert('Ошибка при сохранении профиля');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) return <div className="profile-container">Загрузка...</div>;
  if (!user) return <div className="profile-container">Ошибка загрузки профиля</div>;

  const avatarUrl = user.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

  return (
    <div className="profile-container">
      <div className="profile-header">
        <img src={avatarUrl} alt="avatar" className="profile-avatar" />
        <h1>{user.username || user.email}</h1>
        <p className="profile-email">{user.email}</p>
        <p className="profile-bio">{user.bio || 'Пользователь пока ничего не рассказал о себе'}</p>
        <button className="edit-profile-btn" onClick={() => setShowModal(true)}>
          <i className="fas fa-pen"></i> Редактировать профиль
        </button>
      </div>

      <div className="profile-stats">
        <div className="stat">
          <span className="stat-value">{user.level || 1}</span>
          <span className="stat-label">Уровень</span>
        </div>
        <div className="stat">
          <span className="stat-value">{user.experience_points || 0}</span>
          <span className="stat-label">Опыт</span>
        </div>
        <div className="stat">
          <span className="stat-value">{myConfigs.length}</span>
          <span className="stat-label">Создано тренажёров</span>
        </div>
      </div>

      <div className="achievements-section">
        <h2><i className="fas fa-trophy"></i> Достижения</h2>
        <div className="achievements-grid">
          {achievements.length === 0 ? (
            <div className="achievement-card empty">
              <div className="achievement-icon"><i className="fas fa-medal"></i></div>
              <div className="achievement-info">
                <h4>Нет достижений</h4>
                <p>Проходите тренировки, чтобы получать награды!</p>
              </div>
            </div>
          ) : (
            achievements.map(ua => (
              <div key={ua.id} className="achievement-card">
                <div className="achievement-icon">{ua.achievement.icon || '🏆'}</div>
                <div className="achievement-info">
                  <h4>{ua.achievement.name}</h4>
                  <p>{ua.achievement.description}</p>
                  <small>Получено: {new Date(ua.earned_at).toLocaleDateString()}</small>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="my-exercises">
        <h2><i className="fas fa-cubes"></i> Мои тренажёры</h2>
        {myConfigs.length === 0 ? (
          <div className="empty-state">Вы ещё не создали ни одного тренажёра</div>
        ) : (
          <div className="configs-grid">
            {myConfigs.map(cfg => (
              <div key={cfg.id} className="config-card">
                <h3>{cfg.name}</h3>
                <p>{cfg.description || 'Нет описания'}</p>
                <div className="config-meta">
                  <span><i className="fas fa-tag"></i> {cfg.exercise_type_name}</span>
                  <span><i className="fas fa-chart-simple"></i> {cfg.difficulty_name}</span>
                  <span><i className="fas fa-list"></i> {cfg.questions_per_session} заданий</span>
                </div>
                <button className="start-btn" onClick={() => navigate(`/exercise/${cfg.id}`)}>
                  <i className="fas fa-play"></i> Начать
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Редактировать профиль</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Имя пользователя</label>
                <input type="text" name="username" value={editForm.username} onChange={handleEditChange} required />
              </div>
              <div className="form-group">
                <label>О себе</label>
                <textarea name="bio" rows="3" value={editForm.bio} onChange={handleEditChange} placeholder="Расскажите о себе..." />
              </div>
              <div className="form-group">
                <label>URL аватара</label>
                <input type="url" name="avatar" value={editForm.avatar} onChange={handleEditChange} placeholder="https://example.com/avatar.png" />
              </div>
              <div className="modal-buttons">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Отмена</button>
                <button type="submit" className="save-btn" disabled={editLoading}>{editLoading ? 'Сохранение...' : 'Сохранить'}</button>
              </div>
            </form>
          </div>
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
        <button className="nav-icon" onClick={() => navigate('/gallery')}>
          <i className="fas fa-images"></i>
        </button>
        <button className="nav-icon active" onClick={() => navigate('/profile')}>
          <i className="fas fa-user"></i>
        </button>
      </nav>
    </div>
  );
};

export default ProfilePage;