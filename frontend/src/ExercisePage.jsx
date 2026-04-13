import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PianoExercise from './PianoExercise';
import ChoiceExercise from './ChoiceExercise';
import soundEngine from './soundEngine';
import { getOctaveRange } from './exerciseLogic';
import {
  generateNoteWithConfig,
  generateIntervalWithConfig,
  generateChordWithConfig,
  generateChoicesForNote,
  generateChoicesForInterval,
  generateChoicesForChord,
  playNote,
  playInterval,
  playChord,
} from './exerciseLogic';
import './ExercisePage.css';





const ExercisePage = () => {
  const { id: configId } = useParams();
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const octaveRange = config ? getOctaveRange(config.difficulty_name) : { min: 3, max: 5 };
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [highlightNote, setHighlightNote] = useState(null);
  const [errorNote, setErrorNote] = useState(null);
  const [pianoDisabled, setPianoDisabled] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [audioAllowed, setAudioAllowed] = useState(false);
  const [questionsReady, setQuestionsReady] = useState(false);
  const audioActivated = useRef(false);

  // Загрузка конфигурации и генерация вопросов
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await axios.get(`/api/configs/${configId}/`);
        setConfig(res.data);
        generateQuestions(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (configId) loadConfig();
  }, [configId]);

  // Генерация вопросов на основе конфигурации (множественные типы)
  const generateQuestions = (cfg) => {
    const total = cfg.questions_per_session;
    const newQuestions = [];
    const difficultyName = cfg.difficulty_name;
    const selectedTypes = cfg.exercise_types;
    const typeSettings = cfg.type_settings || {};

    for (let i = 0; i < total; i++) {
      const randomType = selectedTypes[Math.floor(Math.random() * selectedTypes.length)];
      const typeId = randomType.id;
      const settingsForType = typeSettings[typeId] || {};
      let question = {};

      if (typeId === 1) { // Ноты
        const noteFilter = settingsForType.notes || 'all';
        const correctNote = generateNoteWithConfig(cfg.settings, difficultyName, noteFilter);
        const choices = generateChoicesForNote(correctNote, difficultyName);
        question = {
          type: 'note',
          text: '🎵 Какая нота звучит?',
          correctAnswer: correctNote,
          correctNoteName: correctNote,
          choices,
          play: () => playNote(correctNote),
          checkPiano: (userNote) => userNote === correctNote,
          checkChoice: (selected) => selected === correctNote,
        };
      } else if (typeId === 2) { // Интервалы
        const allowedIntervals = settingsForType.intervals;
        const { lower, upper, intervalName } = generateIntervalWithConfig(cfg.settings, difficultyName, allowedIntervals);
        const choices = generateChoicesForInterval(intervalName);
        question = {
          type: 'interval',
          text: '🎵 Какой интервал? Нажми верхнюю ноту.',
          correctAnswer: upper,
          correctNoteName: upper,
          lowerNote: lower,
          hintNote: lower,
          upperNote: upper,
          intervalName,
          choices,
          play: () => playInterval(lower, upper),
          checkPiano: (userNote) => userNote === upper,
          checkChoice: (selected) => selected === intervalName,
        };
      } else { // Аккорды
        const allowedChords = settingsForType.chords;
        const { tonic, chordNotes, chordName } = generateChordWithConfig(cfg.settings, difficultyName, allowedChords);
        const choices = generateChoicesForChord(chordName);
        question = {
          type: 'chord',
          text: '🎵 Какой аккорд? Нажми тонику.',
          correctAnswer: tonic,
          correctNoteName: tonic,
          chordNotes,
          chordName,
          choices,
          play: () => playChord(chordNotes),
          checkPiano: (userNote) => userNote === tonic,
          checkChoice: (selected) => selected === chordName,
        };
      }
      question.answerMode = Math.random() < 0.5 ? 'piano' : 'choice';
      newQuestions.push(question);
    }
    setQuestions(newQuestions);
    setQuestionsReady(true);
    setCurrentIndex(0);
    setScore(0);
    setCompleted(false);
    setFeedback(null);
  };

  // Создание сессии в БД
  useEffect(() => {
    if (config && questions.length > 0 && !sessionId && audioAllowed) {
      const createSession = async () => {
        try {
          const res = await axios.post('/api/sessions/', {
            config: config.id,
            status: 'in_progress',
            total_questions: questions.length,
          });
          setSessionId(res.data.id);
        } catch (err) {
          console.error('Ошибка создания сессии', err);
        }
      };
      createSession();
    }
  }, [config, questions, sessionId, audioAllowed]);

  // Автоматическое воспроизведение первого вопроса после активации звука и готовности вопросов
  useEffect(() => {
    if (audioAllowed && questionsReady && questions.length > 0 && !audioActivated.current) {
      audioActivated.current = true;
      // Даём небольшую задержку, чтобы AudioContext успел инициализироваться
      setTimeout(() => {
        questions[0]?.play();
      }, 100);
    }
  }, [audioAllowed, questionsReady, questions]);

  // Переключение вопроса – автоматическое воспроизведение следующего
  useEffect(() => {
    if (audioAllowed && questionsReady && questions.length > 0 && currentIndex > 0 && !pianoDisabled) {
      questions[currentIndex]?.play();
    }
  }, [currentIndex, audioAllowed, questionsReady, questions, pianoDisabled]);



  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progress = totalQuestions ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

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

  const handleAnswer = (isCorrect, userAnswer) => {
    if (isCorrect) {
      playFeedbackSound(true);
      setScore(score + 1);
      setFeedback({ correct: true, message: '✅ Правильно!' });
    } else {
      playFeedbackSound(false);
      let correctAnswerText = currentQuestion.correctAnswer;
      if (currentQuestion.type === 'interval') correctAnswerText = currentQuestion.upperNote;
      if (currentQuestion.type === 'chord') correctAnswerText = currentQuestion.correctNoteName;
      setFeedback({ correct: false, message: `❌ Неправильно. Правильный ответ: ${correctAnswerText}` });
    }
    setPianoDisabled(true);

    setTimeout(() => {
      setFeedback(null);
      setPianoDisabled(false);
      setHighlightNote(null);
      setErrorNote(null);
      if (currentIndex + 1 < totalQuestions) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCompleted(true);
        if (sessionId) {
          axios.patch(`/api/sessions/${sessionId}/`, {
            status: 'completed',
            completed_at: new Date().toISOString(),
            answered_questions: totalQuestions,
            correct_answers: score + (isCorrect ? 1 : 0),
          }).catch(err => console.error(err));
        }
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
    if (config) generateQuestions(config);
    setCurrentIndex(0);
    setScore(0);
    setCompleted(false);
    setFeedback(null);
    setPianoDisabled(false);
    setHighlightNote(null);
    setErrorNote(null);
    audioActivated.current = false;
    setAudioAllowed(false); // придётся снова разрешить звук
    setQuestionsReady(false);
  };
    // Устанавливаем подсветку нижней ноты для интервалов при смене вопроса
  useEffect(() => {
    if (currentQuestion) {
      setHighlightNote(currentQuestion.hintNote || null);
      setErrorNote(null);
    }
  }, [currentQuestion]);

  // Экран загрузки
  if (loading) return <div className="exercise-container">Загрузка...</div>;

  // Экран активации звука
  if (!audioAllowed) {
    return (
      <div className="exercise-container">
        <div className="activate-audio-card">
          <h2>🎧 Нажмите, чтобы разрешить звук</h2>
          <p>Для прохождения тренировки необходимо разрешить воспроизведение звука.</p>
          <button
            className="activate-btn"
            onClick={async () => {
              await soundEngine.initAudioContext();
              setAudioAllowed(true);
            }}
          >
            Начать тренировку
          </button>
        </div>
      </div>
    );
  }

  // Экран результатов
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

  // Основной рендер
  return (
    <div className="exercise-container">
      <button className="back-button" onClick={() => navigate('/')}>← Назад</button>
      <div className="exercise-content">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="question-card">
          <h2>{currentQuestion?.text}</h2>
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