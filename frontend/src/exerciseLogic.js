import soundEngine from './soundEngine';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const INTERVALS = [
  { semitones: 3, name: 'Малая терция' },
  { semitones: 4, name: 'Большая терция' },
  { semitones: 5, name: 'Кварта' },
  { semitones: 7, name: 'Квинта' },
  { semitones: 8, name: 'Малая секста' },
  { semitones: 9, name: 'Большая секста' },
];

const CHORD_TYPES = [
  { name: 'Мажор', pattern: [0, 4, 7] },
  { name: 'Минор', pattern: [0, 3, 7] },
];

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
export const getOctaveRange = (difficultyName) => {
  switch (difficultyName?.toLowerCase()) {
    case 'лёгкая': case 'easy': return { min: 4, max: 4 };
    case 'средняя': case 'medium': return { min: 3, max: 4 };
    case 'сложная': case 'hard': return { min: 2, max: 4 };
    default: return { min: 3, max: 5 };
  }
};

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

export const generateIntervalWithConfig = (settings, difficultyName, allowedIntervals) => {
  let intervalList = allowedIntervals?.length ? allowedIntervals : INTERVALS.map(i => i.name);
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

export const generateChordWithConfig = (settings, difficultyName, allowedChords) => {
  let chordList = allowedChords?.length ? allowedChords : CHORD_TYPES.map(c => c.name);
  const chordTypeName = chordList[Math.floor(Math.random() * chordList.length)];
  const chordType = CHORD_TYPES.find(c => c.name === chordTypeName) || CHORD_TYPES[0];
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

// Стандартные генераторы вариантов
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

// ========== ВАРИАНТЫ ДЛЯ ОДНОГО ТИПА ИНТЕРВАЛА ==========
export const generateSpecificIntervalChoices = (intervalName, config, difficultyName, lowerNote, upperNote) => {
  const interval = INTERVALS.find(i => i.name === intervalName);
  if (!interval) return [];
  const semitones = interval.semitones;
  const octaveRange = getOctaveRange(difficultyName);
  const minOct = config.settings?.min_octave || octaveRange.min;
  const maxOct = config.settings?.max_octave || octaveRange.max;
  const allowedNotes = [];
  for (let oct = minOct; oct <= maxOct; oct++) {
    for (let note of NOTE_NAMES) {
      allowedNotes.push(`${note}${oct}`);
    }
  }
  const choicesSet = new Set();
  const correctChoice = `${lowerNote}→${upperNote}`;
  choicesSet.add(correctChoice);
  let attempts = 0;
  while (choicesSet.size < 4 && attempts < 50) {
    const lower = allowedNotes[Math.floor(Math.random() * allowedNotes.length)];
    const lowerName = lower.slice(0, -1);
    const lowerOct = parseInt(lower.slice(-1));
    let idx = NOTE_NAMES.indexOf(lowerName);
    let newIdx = idx + semitones;
    let newOct = lowerOct;
    if (newIdx >= NOTE_NAMES.length) {
      newIdx -= NOTE_NAMES.length;
      newOct++;
    }
    if (newOct > maxOct) continue;
    const upper = `${NOTE_NAMES[newIdx]}${newOct}`;
    const choice = `${lower}→${upper}`;
    choicesSet.add(choice);
    attempts++;
  }
  let result = Array.from(choicesSet);
  while (result.length < 4) result.push(result[0]);
  return result.sort(() => Math.random() - 0.5);
};

// ========== ВАРИАНТЫ ДЛЯ ОДНОГО ТИПА АККОРДА ==========
export const generateSpecificChordChoices = (chordName, config, difficultyName) => {
  const parts = chordName.split(' ');
  const chordType = parts[parts.length - 1];
  const octaveRange = getOctaveRange(difficultyName);
  const minOct = config.settings?.min_octave || octaveRange.min;
  const maxOct = config.settings?.max_octave || octaveRange.max;
  const allowedTonics = [];
  for (let oct = minOct; oct <= maxOct; oct++) {
    for (let note of NOTE_NAMES) {
      allowedTonics.push(note);
    }
  }
  const choicesSet = new Set();
  choicesSet.add(chordName);
  let attempts = 0;
  while (choicesSet.size < 4 && attempts < 50) {
    const tonic = allowedTonics[Math.floor(Math.random() * allowedTonics.length)];
    const choice = `${tonic} ${chordType}`;
    choicesSet.add(choice);
    attempts++;
  }
  let result = Array.from(choicesSet);
  while (result.length < 4) result.push(result[0]);
  return result.sort(() => Math.random() - 0.5);
};

// ========== ВАРИАНТЫ ДЛЯ НЕСКОЛЬКИХ ТИПОВ АККОРДОВ (без повторов) ==========
export const generateChoicesForChordType = (chordName, allTypes) => {
  const chordType = chordName.split(' ').pop();
  // allTypes — список выбранных типов аккордов (из настроек)
  if (!allTypes.includes(chordType)) allTypes.push(chordType);
  // Возвращаем ровно столько вариантов, сколько типов, без повторов
  return allTypes.sort(() => Math.random() - 0.5);
};

// ========== ВАРИАНТЫ ДЛЯ НЕСКОЛЬКИХ ИНТЕРВАЛОВ (без повторов) ==========
export const generateChoicesForIntervalType = (correctName, allIntervals) => {
  // allIntervals — список выбранных интервалов
  if (!allIntervals.includes(correctName)) allIntervals.push(correctName);
  return allIntervals.sort(() => Math.random() - 0.5);
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

// ========== ОСНОВНАЯ ФУНКЦИЯ ==========
export const generateQuestionFromBackend = (backendQuestion, config, difficultyName) => {
  const { type, text, correctNote, intervalName, lowerNote, upperNote, chordName, tonicNote, chordNotes, answer_mode } = backendQuestion;
  const typeId = type === 'note' ? 1 : (type === 'interval' ? 2 : 3);
  const typeSettings = config.type_settings?.[typeId] || {};
  
  let answerMode = 'random';
  if (answer_mode === 'piano') answerMode = 'piano';
  else if (answer_mode === 'choice') answerMode = 'choice';
  else answerMode = Math.random() < 0.5 ? 'piano' : 'choice';
  
  let elementsCount = 0;
  let allTypes = [];
  if (type === 'interval') {
    elementsCount = typeSettings.intervals?.length || 0;
    allTypes = typeSettings.intervals || [];
  }
  if (type === 'chord') {
    elementsCount = typeSettings.chords?.length || 0;
    allTypes = typeSettings.chords || [];
  }

  if (type === 'note') {
    const choices = generateChoicesForNote(correctNote, difficultyName);
    return {
      type: 'note',
      text,
      correctAnswer: correctNote,
      correctNoteName: correctNote,
      choices,
      play: () => playNote(correctNote),
      checkPiano: (userNote) => userNote === correctNote,
      checkChoice: (selected) => selected === correctNote,
      answerMode,
    };
  }
  
  if (type === 'interval') {
    let choices;
    let correctChoice;
    if (answerMode === 'choice') {
      if (elementsCount === 1) {
        // Один интервал: варианты – конкретные интервалы с нотами
        choices = generateSpecificIntervalChoices(intervalName, config, difficultyName, lowerNote, upperNote);
        correctChoice = `${lowerNote}→${upperNote}`;
      } else {
        // Несколько интервалов: варианты – названия интервалов (без повторов)
        choices = generateChoicesForIntervalType(intervalName, allTypes);
        correctChoice = intervalName;
      }
    } else {
      // Для режима piano варианты не нужны, но для совместимости оставим
      choices = [];
      correctChoice = '';
    }
    return {
      type: 'interval',
      text,
      correctAnswer: upperNote,
      correctNoteName: upperNote,
      lowerNote,
      hintNote: lowerNote,
      upperNote,
      intervalName,
      choices,
      play: () => playInterval(lowerNote, upperNote),
      checkPiano: (userNote) => userNote === upperNote,
      checkChoice: (selected) => selected === correctChoice,
      answerMode,
    };
  }
  
  // Аккорды
  let choices;
  let correctChoice;
  if (answerMode === 'choice') {
    if (elementsCount === 1) {
      // Один тип аккорда: варианты – конкретные аккорды (C мажор, D мажор...)
      choices = generateSpecificChordChoices(chordName, config, difficultyName);
      correctChoice = chordName;
    } else {
      // Несколько типов: варианты – названия типов (Мажор, Минор...), без повторов
      choices = generateChoicesForChordType(chordName, allTypes);
      correctChoice = chordName.split(' ').pop();
    }
  } else {
    choices = [];
    correctChoice = '';
  }
  return {
    type: 'chord',
    text,
    correctAnswer: tonicNote,
    correctNoteName: tonicNote,
    chordNotes,
    chordName,
    choices,
    play: () => playChord(chordNotes),
    checkPiano: (userNote) => userNote === tonicNote,
    checkChoice: (selected) => selected === correctChoice,
    answerMode,
  };
};