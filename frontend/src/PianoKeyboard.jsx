import React, { useState } from 'react';
import soundEngine from './soundEngine';
import './PianoKeyboard.css';

const PianoKeyboard = ({ 
  onNoteClick, 
  disabled = false, 
  startOctave = 3, 
  endOctave = 5, 
  highlightNote = null,
  errorNote = null
}) => {
  const generateNotes = () => {
    const notes = [];
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    for (let octave = startOctave; octave <= endOctave; octave++) {
      for (let i = 0; i < noteNames.length; i++) {
        const name = noteNames[i];
        const isBlack = name.includes('#');
        const fullName = `${name}${octave}`;
        const midiNumber = 12 + (octave + 1) * 12 + i;
        notes.push({ fullName, midi: midiNumber, isBlack, displayName: name.replace('#', '♯') });
      }
    }
    return notes;
  };

  const notes = generateNotes();
  const [pressedNote, setPressedNote] = useState(null);

  const handleClick = async (note) => {
    if (disabled) return;
    await soundEngine.initAudioContext();
    setPressedNote(note.fullName);
    await soundEngine.playNote(note.fullName);
    if (onNoteClick) onNoteClick(note.fullName);
    setTimeout(() => setPressedNote(null), 150);
  };

  const getHighlightClass = (noteFullName) => {
    if (errorNote === noteFullName) return 'highlight-red';
    if (highlightNote === noteFullName) return 'highlight-green';
    return '';
  };

  return (
    <div className="piano-container">
      <div className="piano-keyboard">
        {notes.map((note, idx) => (
          <button
            key={idx}
            className={`piano-key piano-key-${note.isBlack ? 'black' : 'white'} 
                        ${pressedNote === note.fullName ? 'pressed' : ''}
                        ${getHighlightClass(note.fullName)}`}
            onClick={() => handleClick(note)}
            disabled={disabled}
          >
            <span className="note-name">{note.displayName}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PianoKeyboard;