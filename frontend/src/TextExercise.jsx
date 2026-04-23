// // src/TextExercise.jsx
// import React, { useState } from 'react';

// const TextExercise = ({ onAnswer, disabled }) => {
//   const [value, setValue] = useState('');

//   const handleSubmit = () => {
//     if (value.trim()) {
//       onAnswer(value.trim());
//       setValue('');
//     }
//   };

//   return (
//     <div className="text-input-area">
//       <input
//         type="text"
//         value={value}
//         onChange={(e) => setValue(e.target.value)}
//         placeholder="Введи ответ..."
//         onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
//         disabled={disabled}
//       />
//       <button onClick={handleSubmit} disabled={disabled}>
//         Проверить →
//       </button>
//     </div>
//   );
// };

// export default TextExercise;