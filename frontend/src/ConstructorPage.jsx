import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ConstructorPage.css';

const ConstructorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    exercise_type_ids: [],
    difficulty: '',
    questions_per_session: 10,
    time_limit_seconds: 0,
    is_public: false,
    type_settings: {},
    settings: {}
  });
  const [exerciseTypes, setExerciseTypes] = useState([]);
  const [difficulties, setDifficulties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(!!id);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesRes, diffRes] = await Promise.all([
          axios.get('/api/exercise-types/'),
          axios.get('/api/difficulties/')
        ]);
        setExerciseTypes(typesRes.data);
        setDifficulties(diffRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (id) {
      const fetchConfig = async () => {
        try {
          const res = await axios.get(`/api/configs/${id}/`);
          const cfg = res.data;
          setFormData({
            name: cfg.name || '',
            description: cfg.description || '',
            exercise_type_ids: cfg.exercise_types.map(t => t.id),
            difficulty: cfg.difficulty,
            questions_per_session: cfg.questions_per_session,
            time_limit_seconds: cfg.time_limit_seconds,
            is_public: cfg.is_public,
            type_settings: cfg.type_settings || {},
            settings: cfg.settings || {}
          });
        } catch (err) {
          setError('Не удалось загрузить тренажёр');
          console.error(err);
        } finally {
          setInitialLoading(false);
        }
      };
      fetchConfig();
    } else {
      setInitialLoading(false);
    }
  }, [id]);

  const handleTypeToggle = (typeId) => {
    setFormData(prev => {
      const newIds = prev.exercise_type_ids.includes(typeId)
        ? prev.exercise_type_ids.filter(id => id !== typeId)
        : [...prev.exercise_type_ids, typeId];
      return { ...prev, exercise_type_ids: newIds };
    });
  };

  const handleTypeSettingsChange = (typeId, settingKey, value) => {
    setFormData(prev => ({
      ...prev,
      type_settings: {
        ...prev.type_settings,
        [typeId]: {
          ...(prev.type_settings[typeId] || {}),
          [settingKey]: value
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const payload = {
      name: formData.name,
      description: formData.description,
      exercise_type_ids: formData.exercise_type_ids,
      difficulty: parseInt(formData.difficulty),
      questions_per_session: parseInt(formData.questions_per_session) || 10,
      time_limit_seconds: parseInt(formData.time_limit_seconds) || 0,
      is_public: formData.is_public,
      type_settings: formData.type_settings,
      settings: formData.settings
    };
    try {
      if (id) {
        await axios.patch(`/api/configs/${id}/`, payload);
      } else {
        await axios.post('/api/configs/', payload);
      }
      navigate('/');
    } catch (err) {
      console.error('Ошибка сохранения:', err.response?.data);
      setError(err.response?.data?.detail || 'Ошибка сохранения тренажёра');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  if (initialLoading) return <div className="constructor-container">Загрузка...</div>;

  return (
    <div className="constructor-container">
      {/* Верхняя панель с кнопкой назад */}
      <div className="constructor-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1>{id ? 'Редактировать тренажёр' : 'Создать тренажёр'}</h1>
        <div className="placeholder"></div> {/* для выравнивания */}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label><i className="fas fa-tag"></i> Название</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Например: Интервалы для начинающих" />
        </div>

        <div className="form-group">
          <label><i className="fas fa-align-left"></i> Описание</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows="3" placeholder="Краткое описание тренажёра" />
        </div>

        <div className="form-group">
          <label><i className="fas fa-puzzle-piece"></i> Типы упражнений</label>
          <div className="checkbox-group-vertical">
            {exerciseTypes.map(type => (
              <label key={type.id} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.exercise_type_ids.includes(type.id)}
                  onChange={() => handleTypeToggle(type.id)}
                />
                <span>{type.name}</span>
              </label>
            ))}
          </div>
        </div>

        {formData.exercise_type_ids.includes(1) && (
          <div className="form-group">
            <label><i className="fas fa-music"></i> Настройки для нот</label>
            <select
              value={formData.type_settings[1]?.notes || 'all'}
              onChange={(e) => handleTypeSettingsChange(1, 'notes', e.target.value)}
            >
              <option value="all">Все клавиши</option>
              <option value="white">Только белые</option>
              <option value="black">Только чёрные</option>
            </select>
          </div>
        )}

        {formData.exercise_type_ids.includes(2) && (
          <div className="form-group">
            <label><i className="fas fa-chart-line"></i> Интервалы</label>
            <div className="checkbox-group-vertical">
              {['Малая терция', 'Большая терция', 'Кварта', 'Квинта', 'Малая секста', 'Большая секста'].map(interval => (
                <label key={interval} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.type_settings[2]?.intervals?.includes(interval) || false}
                    onChange={(e) => {
                      const current = formData.type_settings[2]?.intervals || [];
                      const newList = e.target.checked
                        ? [...current, interval]
                        : current.filter(i => i !== interval);
                      handleTypeSettingsChange(2, 'intervals', newList);
                    }}
                  />
                  <span>{interval}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {formData.exercise_type_ids.includes(3) && (
          <div className="form-group">
            <label><i className="fas fa-chord"></i> Типы аккордов</label>
            <div className="checkbox-group-vertical">
              {['Мажор', 'Минор', 'Увеличенный', 'Уменьшенный'].map(chord => (
                <label key={chord} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.type_settings[3]?.chords?.includes(chord) || false}
                    onChange={(e) => {
                      const current = formData.type_settings[3]?.chords || [];
                      const newList = e.target.checked
                        ? [...current, chord]
                        : current.filter(c => c !== chord);
                      handleTypeSettingsChange(3, 'chords', newList);
                    }}
                  />
                  <span>{chord}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label><i className="fas fa-chart-simple"></i> Сложность</label>
          <select name="difficulty" value={formData.difficulty} onChange={handleChange} required>
            <option value="">Выберите сложность</option>
            {difficulties.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} {d.name === 'Лёгкая' ? '(октава 4)' : d.name === 'Средняя' ? '(октавы 3-4)' : '(октавы 2-4)'}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label><i className="fas fa-list-ol"></i> Количество заданий (5–50)</label>
          <input
            type="number"
            name="questions_per_session"
            min="5"
            max="50"
            value={formData.questions_per_session}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label><i className="fas fa-hourglass-half"></i> Лимит времени (сек, 0 = без лимита)</label>
          <input
            type="number"
            name="time_limit_seconds"
            min="0"
            value={formData.time_limit_seconds}
            onChange={handleChange}
          />
        </div>

        <div className="form-group checkbox-group-inline">
          <input type="checkbox" name="is_public" checked={formData.is_public} onChange={handleChange} id="is_public" />
          <label htmlFor="is_public"><i className="fas fa-globe"></i> Публичный тренажёр</label>
        </div>

        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Сохранение...' : (id ? 'Сохранить изменения' : 'Создать тренажёр')}
          <i className="fas fa-check"></i>
        </button>
      </form>

      {/* Нижняя навигация, как на главной */}
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
        <button className="nav-icon" onClick={() => navigate('/profile')}>
          <i className="fas fa-user"></i>
        </button>
      </nav>
    </div>
  );
};

export default ConstructorPage;