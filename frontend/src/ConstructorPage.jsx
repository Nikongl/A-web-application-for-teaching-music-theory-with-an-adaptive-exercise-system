import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ConstructorPage.css';

const ConstructorPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    exercise_type_ids: [],
    difficulty: '',
    questions_per_session: 10,
    time_limit_seconds: 0,
    is_public: false,
    type_settings: {}
  });
  const [exerciseTypes, setExerciseTypes] = useState([]);
  const [difficulties, setDifficulties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      settings: {}
    };
    try {
      await axios.post('/api/configs/', payload);
      navigate('/');
    } catch (err) {
      console.error('Ошибка создания:', err.response?.data);
      setError(err.response?.data?.detail || 'Ошибка создания тренажёра');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="constructor-container">
      <h1>Создать тренажёр</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Название</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
          <label>Описание</label>
          <textarea
            rows="3"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>
        <div className="form-group">
          <label>Типы упражнений</label>
          <div className="checkbox-group-vertical">
            {exerciseTypes.map(type => (
              <label key={type.id}>
                <input
                  type="checkbox"
                  checked={formData.exercise_type_ids.includes(type.id)}
                  onChange={() => handleTypeToggle(type.id)}
                />
                {type.name}
              </label>
            ))}
          </div>
        </div>

        {formData.exercise_type_ids.includes(1) && (
          <div className="form-group">
            <label>Настройки для нот</label>
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
            <label>Интервалы</label>
            <div className="checkbox-group-vertical">
              {['Малая терция', 'Большая терция', 'Кварта', 'Квинта', 'Малая секста', 'Большая секста'].map(interval => (
                <label key={interval}>
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
                  {interval}
                </label>
              ))}
            </div>
          </div>
        )}

        {formData.exercise_type_ids.includes(3) && (
          <div className="form-group">
            <label>Типы аккордов</label>
            <div className="checkbox-group-vertical">
              {['Мажор', 'Минор', 'Увеличенный', 'Уменьшенный'].map(chord => (
                <label key={chord}>
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
                  {chord}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Сложность (определяет диапазон октав)</label>
          <select
            value={formData.difficulty}
            onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
            required
          >
            <option value="">Выберите сложность</option>
            {difficulties.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} {d.name === 'Лёгкая' ? '(октава 4)' : d.name === 'Средняя' ? '(октавы 3-4)' : '(октавы 2-4)'}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Количество заданий (5–50)</label>
          <input
            type="number"
            min="5"
            max="50"
            value={formData.questions_per_session}
            onChange={(e) => setFormData({...formData, questions_per_session: e.target.value === '' ? '' : parseInt(e.target.value)})}
          />
        </div>

        <div className="form-group">
          <label>Лимит времени (сек, 0 = без лимита)</label>
          <input
            type="number"
            min="0"
            value={formData.time_limit_seconds}
            onChange={(e) => setFormData({...formData, time_limit_seconds: e.target.value === '' ? '' : parseInt(e.target.value)})}
          />
        </div>

        <div className="form-group checkbox-group">
          <input
            type="checkbox"
            checked={formData.is_public}
            onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
          />
          <label>Публичный тренажёр</label>
        </div>

        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Сохранение...' : 'Создать тренажёр'}
        </button>
      </form>
    </div>
  );
};

export default ConstructorPage;