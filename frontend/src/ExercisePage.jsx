import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PianoExercise from './PianoExercise';
import ChoiceExercise from './ChoiceExercise';
import soundEngine from './soundEngine';
import { getOctaveRange, generateQuestionFromBackend } from './exerciseLogic';
import './ExercisePage.css';

const ExercisePage = ({ onRefreshUser }) => {
  const { id: configId } = useParams();
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [highlightNote, setHighlightNote] = useState(null);
  const [errorNote, setErrorNote] = useState(null);
  const [pianoDisabled, setPianoDisabled] = useState(false);
  const [audioAllowed, setAudioAllowed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);
  const audioActivated = useRef(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await axios.get(`/api/configs/${configId}/`);
        const configData = res.data;
        setConfig(configData);
        setTotalQuestions(configData.questions_per_session);
        const sessionRes = await axios.post('/api/sessions/', {
          config: configId,
          status: 'in_progress',
          total_questions: configData.questions_per_session,
        });
        const newSessionId = sessionRes.data.id;
        setSessionId(newSessionId);
        await fetchNextQuestion(newSessionId, configData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (configId) loadConfig();
  }, [configId]);

  const fetchNextQuestion = async (sid, cfg) => {
    try {
      const res = await axios.get(`/api/next-question/?config_id=${configId}&session_id=${sid}`);
      const backendQuestion = res.data;
      const difficultyName = cfg.difficulty_name;
      const question = generateQuestionFromBackend(backendQuestion, cfg, difficultyName);
      setCurrentQuestion(question);
    } catch (err) {
      console.error('Ошибка получения следующего вопроса', err);
    }
  };

  const updateProgress = async (exerciseType, elementKey, elementName, wasCorrect) => {
    try {
      await axios.post('/api/user-progress/update/', {
        exercise_type: exerciseType,
        element_key: elementKey,
        element_name: elementName,
        was_correct: wasCorrect,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const playFeedbackSound = (isCorrect) => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (isCorrect) {
      osc.frequency.value = 880;
      gain.gain.value = 0.2;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      osc.stop(ctx.currentTime + 0.5);
    } else {
      osc.frequency.value = 440;
      gain.gain.value = 0.15;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
      osc.stop(ctx.currentTime + 0.8);
    }
  };

  // Таймер: при смене вопроса запускаем новый отсчёт
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!currentQuestion || pianoDisabled || feedback || !config) return;

    const timeLimit = config.time_limit_seconds;
    if (timeLimit && timeLimit > 0) {
      setTimeLeft(timeLimit);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // Время вышло – ответ засчитывается как неправильный
            handleAnswer(false, null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestion, pianoDisabled, feedback, config]);

  const handleAnswer = async (isCorrect, userAnswer) => {
    if (!currentQuestion) return;

    // Останавливаем таймер
    if (timerRef.current) clearInterval(timerRef.current);

    const q = currentQuestion;
    let elementKey, elementName, exerciseType;
    if (q.type === 'note') {
      exerciseType = 1;
      elementKey = q.correctNoteName;
      elementName = q.correctNoteName;
    } else if (q.type === 'interval') {
      exerciseType = 2;
      elementKey = q.intervalName;
      elementName = q.intervalName;
    } else {
      exerciseType = 3;
      elementKey = q.chordName;
      elementName = q.chordName;
    }
    await updateProgress(exerciseType, elementKey, elementName, isCorrect);

    if (isCorrect) {
      playFeedbackSound(true);
      setScore(score + 1);
      setFeedback({ correct: true, message: '✅ Правильно!' });
    } else {
      playFeedbackSound(false);
      let correctAnswerText = q.correctAnswer;
      if (q.type === 'interval') correctAnswerText = q.upperNote;
      if (q.type === 'chord') correctAnswerText = q.correctNoteName;
      setFeedback({ correct: false, message: `❌ Неправильно. Правильный ответ: ${correctAnswerText}` });
    }

    setPianoDisabled(true);
    const newCount = questionCount + 1;
    setQuestionCount(newCount);

    if (sessionId) {
      await axios.patch(`/api/sessions/${sessionId}/`, {
        answered_questions: newCount,
        correct_answers: score + (isCorrect ? 1 : 0),
      }).catch(err => console.error(err));
    }

    setTimeout(async () => {
      setFeedback(null);
      setPianoDisabled(false);
      setHighlightNote(null);
      setErrorNote(null);
      if (newCount < totalQuestions) {
        await fetchNextQuestion(sessionId, config);
      } else {
        setCompleted(true);
        if (sessionId) {
          await axios.patch(`/api/sessions/${sessionId}/`, {
            status: 'completed',
            completed_at: new Date().toISOString(),
            answered_questions: totalQuestions,
            correct_answers: score + (isCorrect ? 1 : 0),
          }).catch(err => console.error(err));
        }
        if (onRefreshUser) onRefreshUser();
      }
    }, 1500);
  };

  const handlePianoClick = (noteName) => {
    if (!currentQuestion || pianoDisabled || currentQuestion.answerMode !== 'piano') return;
    if (currentQuestion.type === 'interval' && noteName === currentQuestion.lowerNote) return;
    const isCorrect = currentQuestion.checkPiano(noteName);
    if (isCorrect) setHighlightNote(noteName);
    else setErrorNote(noteName);
    handleAnswer(isCorrect, noteName);
  };

  const handleChoiceClick = (selected) => {
    if (!currentQuestion || pianoDisabled || currentQuestion.answerMode !== 'choice') return;
    const isCorrect = currentQuestion.checkChoice(selected);
    handleAnswer(isCorrect, selected);
  };

  const restart = () => {
    window.location.reload();
  };

  if (loading) return <div className="exercise-container">Загрузка...</div>;

  if (!audioAllowed) {
    return (
      <div className="exercise-container">
        <div className="activate-audio-card">
          <h2>🎧 Нажмите, чтобы разрешить звук</h2>
          <button className="activate-btn" onClick={async () => {
            await soundEngine.initAudioContext();
            setAudioAllowed(true);
          }}>Начать тренировку</button>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="exercise-container">
        <button className="back-button" onClick={() => navigate('/')}>← Назад</button>
        <div className="result-card">
          <h2>🎉 Тренировка завершена!</h2>
          <p>Твой результат: {score} из {totalQuestions}</p>
          <p>Процент: {Math.round((score / totalQuestions) * 100)}%</p>
          <button className="restart-btn" onClick={restart}>Пройти заново</button>
        </div>
      </div>
    );
  }

  const progress = totalQuestions ? ((questionCount / totalQuestions) * 100) : 0;
  const octaveRange = config ? getOctaveRange(config.difficulty_name) : { min: 3, max: 5 };

  return (
    <div className="exercise-container">
      <button className="back-button" onClick={() => navigate('/')}>← Назад</button>
      <div className="exercise-content">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="question-card">
          <h2>{currentQuestion?.text}</h2>
          {timeLeft !== null && timeLeft > 0 && (
            <div className="timer" style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff6b6b', marginTop: '10px' }}>
              ⏱️ Осталось: {timeLeft} сек
            </div>
          )}
          <button className="repeat-btn" onClick={() => currentQuestion?.play()}>🔊 Повторить звук</button>
        </div>

        {currentQuestion?.answerMode === 'piano' && (
          <PianoExercise
            onAnswer={handlePianoClick}
            disabled={pianoDisabled}
            highlightNote={highlightNote}
            errorNote={errorNote}
            startOctave={octaveRange.min}
            endOctave={octaveRange.max}
          />
        )}
        {currentQuestion?.answerMode === 'choice' && (
          <ChoiceExercise
            choices={currentQuestion.choices}
            onAnswer={handleChoiceClick}
            disabled={pianoDisabled}
          />
        )}

        {feedback && (
          <div className={`feedback ${feedback.correct ? 'feedback-correct' : 'feedback-wrong'}`}>
            {feedback.message}
          </div>
        )}
        <div className="score">Счёт: {score} / {totalQuestions}</div>
      </div>
    </div>
  );
};

export default ExercisePage;