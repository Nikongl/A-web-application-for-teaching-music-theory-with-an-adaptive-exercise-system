import React from 'react';
import PianoKeyboard from './PianoKeyboard';

const PianoExercise = ({ onAnswer, disabled, highlightNote, errorNote, hintNote, startOctave, endOctave }) => {
  return (
    <div className="piano-exercise">
      <PianoKeyboard 
        onNoteClick={onAnswer} 
        disabled={disabled} 
        highlightNote={highlightNote}
        errorNote={errorNote}
        hintNote={hintNote}
        startOctave={startOctave}
        endOctave={endOctave}
      />
    </div>
  );
};

export default PianoExercise;