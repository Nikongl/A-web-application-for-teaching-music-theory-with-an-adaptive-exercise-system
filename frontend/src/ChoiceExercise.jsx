import React from 'react';

const ChoiceExercise = ({ choices, onAnswer, disabled }) => {
  return (
    <div className="choices-grid-2x2">
      {choices.map((choice, idx) => (
        <button
          key={idx}
          className="choice-button"
          onClick={() => onAnswer(choice)}
          disabled={disabled}
        >
          <span className="choice-letter">{String.fromCharCode(65 + idx)}</span>
          <span className="choice-text">{choice}</span>
        </button>
      ))}
    </div>
  );
};

export default ChoiceExercise;