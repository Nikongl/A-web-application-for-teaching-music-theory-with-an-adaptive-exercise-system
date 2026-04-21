import soundEngine from './soundEngine';

// ========== КОНСТАНТЫ ==========
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Интервалы (для генерации и вариантов)
const INTERVALS = [
  { semitones: 3, name: 'Малая терция' },
  { semitones: 4, name: 'Большая терция' },
  { semitones: 5, name: 'Кварта' },
  { semitones: 7, name: 'Квинта' },
  { semitones: 8, name: 'Малая секста' },
  { semitones: 9, name: 'Большая секста' },
];

// Аккорды (для генерации и вариантов)
const CHORD_TYPES = [
  { name: 'Мажор', pattern: [0, 4, 7] },
  { name: 'Минор', pattern: [0, 3, 7] },
];

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
export const getOctaveRange = (difficultyName) => {
  switch (difficultyName?.toLowerCase()) {
    case 'лёгкая':
    case 'easy':
      return { min: 4, max: 4 };
    case 'средняя':
    case 'medium':
      return { min: 3, max: 4 };
    case 'сложная':
    case 'hard':
      return { min: 2, max: 4 };
    default:
      return { min: 3, max: 5 };
  }
};

// Генерация ноты
export const generateNoteWithConfig = (settings, difficultyName, noteFilter = 'all') => {
  const { min, max } = getOctaveRange(difficultyName);
  const minOctave = settings?.min_octave || min;
  const maxOctave = settings?.max_octave || max;
  let allowedNotes = NOTE_NAMES;
  if (noteFilter === 'white') allowedNotes = NOTE_NAMES.filter(n => !n.includes('#'));
  if (noteFilter === 'black') allowedNotes = NOTE_NAMES.filter(n => n.includes('#'));
  const noteName = allowedNotes[Math.floor(Math.random() * allowedNotes.length)];
  const octave = Math.floor(Math.random() * (maxOctave - minOctave + 1)) + minOctave;
  return `${noteName}${octave}`;
};

// Генерация интервала
export const generateIntervalWithConfig = (settings, difficultyName, allowedIntervals) => {
  let intervalList = (allowedIntervals && allowedIntervals.length) ? allowedIntervals : INTERVALS.map(i => i.name);
  const intervalName = intervalList[Math.floor(Math.random() * intervalList.length)];
  const interval = INTERVALS.find(i => i.name === intervalName);
  const semitones = interval.semitones;
  const lower = generateNoteWithConfig(settings, difficultyName);
  const lowerName = lower.slice(0, -1);
  const lowerOctave = parseInt(lower.slice(-1));
  let lowerIndex = NOTE_NAMES.indexOf(lowerName);
  let upperIndex = lowerIndex + semitones;
  let upperOctave = lowerOctave;
  if (upperIndex >= NOTE_NAMES.length) {
    upperIndex -= NOTE_NAMES.length;
    upperOctave++;
  }
  const upper = `${NOTE_NAMES[upperIndex]}${upperOctave}`;
  return { lower, upper, intervalName };
};

// Генерация аккорда
export const generateChordWithConfig = (settings, difficultyName, allowedChords) => {
  let chordList = (allowedChords && allowedChords.length) ? allowedChords : CHORD_TYPES.map(c => c.name);
  const chordTypeName = chordList[Math.floor(Math.random() * chordList.length)];
  const chordType = CHORD_TYPES.find(c => c.name === chordTypeName);
  const pattern = chordType.pattern;
  const tonic = generateNoteWithConfig(settings, difficultyName);
  const tonicName = tonic.slice(0, -1);
  const tonicOctave = parseInt(tonic.slice(-1));
  let tonicIndex = NOTE_NAMES.indexOf(tonicName);
  const chordNotes = pattern.map(semitones => {
    let idx = tonicIndex + semitones;
    let oct = tonicOctave;
    if (idx >= NOTE_NAMES.length) {
      idx -= NOTE_NAMES.length;
      oct++;
    }
    return `${NOTE_NAMES[idx]}${oct}`;
  });
  return { tonic, chordNotes, chordName: `${tonicName} ${chordTypeName}` };
};

// Варианты ответов
export const generateChoicesForNote = (correctNote, difficultyName) => {
  const choices = [correctNote];
  while (choices.length < 4) {
    const randomNote = generateNoteWithConfig(null, difficultyName);
    if (!choices.includes(randomNote)) choices.push(randomNote);
  }
  return choices.sort(() => Math.random() - 0.5);
};

export const generateChoicesForInterval = (correctName) => {
  const allNames = INTERVALS.map(i => i.name);
  const choices = [correctName];
  while (choices.length < 4) {
    const randomName = allNames[Math.floor(Math.random() * allNames.length)];
    if (!choices.includes(randomName)) choices.push(randomName);
  }
  return choices.sort(() => Math.random() - 0.5);
};

export const generateChoicesForChord = (correctName) => {
  const allChordNames = [];
  for (const note of NOTE_NAMES) {
    for (const type of CHORD_TYPES) {
      allChordNames.push(`${note} ${type.name}`);
    }
  }
  const choices = [correctName];
  while (choices.length < 4) {
    const randomName = allChordNames[Math.floor(Math.random() * allChordNames.length)];
    if (!choices.includes(randomName)) choices.push(randomName);
  }
  return choices.sort(() => Math.random() - 0.5);
};

// Воспроизведение
export const playNote = async (noteName) => {
  await soundEngine.playNote(noteName, 1.2);
};

export const playInterval = async (lower, upper) => {
  await soundEngine.playNote(lower, 0.8);
  await new Promise(resolve => setTimeout(resolve, 200));
  await soundEngine.playNote(upper, 0.8);
};

export const playChord = async (notes) => {
  const ctx = soundEngine.audioContext;
  if (!ctx) return;
  const buffer = await soundEngine.loadSample();
  notes.forEach(note => {
    const semitones = soundEngine.getSemitones(note);
    const ratio = Math.pow(2, semitones / 12);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = ratio;
    const gain = ctx.createGain();
    gain.gain.value = 0.2;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    source.stop(ctx.currentTime + 1.5);
  });
};


// Добавить в конец файла
export const generateQuestionFromBackend = (backendQuestion, config, difficultyName) => {
  const { type, text, correctNote, intervalName, lowerNote, upperNote, chordName, tonicNote, chordNotes } = backendQuestion;
  if (type === 'note') {
    const choices = generateChoicesForNote(correctNote, difficultyName);
    return {
      type: 'note',
      text: text,
      correctAnswer: correctNote,
      correctNoteName: correctNote,
      choices,
      play: () => playNote(correctNote),
      checkPiano: (userNote) => userNote === correctNote,
      checkChoice: (selected) => selected === correctNote,
      answerMode: Math.random() < 0.5 ? 'piano' : 'choice',
    };
  } else if (type === 'interval') {
    const choices = generateChoicesForInterval(intervalName);
    return {
      type: 'interval',
      text: text,
      correctAnswer: upperNote,
      correctNoteName: upperNote,
      lowerNote: lowerNote,
      hintNote: lowerNote,
      upperNote: upperNote,
      intervalName: intervalName,
      choices,
      play: () => playInterval(lowerNote, upperNote),
      checkPiano: (userNote) => userNote === upperNote,
      checkChoice: (selected) => selected === intervalName,
      answerMode: Math.random() < 0.5 ? 'piano' : 'choice',
    };
  } else {
    const choices = generateChoicesForChord(chordName);
    return {
      type: 'chord',
      text: text,
      correctAnswer: tonicNote,
      correctNoteName: tonicNote,
      chordNotes: chordNotes,
      chordName: chordName,
      choices,
      play: () => playChord(chordNotes),
      checkPiano: (userNote) => userNote === tonicNote,
      checkChoice: (selected) => selected === chordName,
      answerMode: Math.random() < 0.5 ? 'piano' : 'choice',
    };
  }
};