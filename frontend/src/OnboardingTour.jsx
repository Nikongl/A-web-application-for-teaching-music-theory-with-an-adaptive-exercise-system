// import React, { useState, useEffect } from 'react';
// import './OnboardingTour.css';

// const OnboardingTour = ({ onComplete }) => {
//   const [step, setStep] = useState(0);
//   const [targetRect, setTargetRect] = useState(null);

//   const steps = [
//     {
//       title: '👋 Добро пожаловать!',
//       text: 'Давайте быстро познакомимся с приложением. Нажмите "Далее", чтобы начать.',
//       targetSelector: null,
//       side: 'center',
//     },
//     {
//       title: '📈 Ваш прогресс',
//       text: 'Здесь отображаются ваш уровень и опыт (XP). Проходя тренировки, вы получаете XP и повышаете уровень.',
//       targetSelector: '.xp-card',
//       side: 'bottom',
//     },
//     {
//       title: '➕ Создание тренажёра',
//       text: 'Нажмите на эту карточку, чтобы создать свой первый тренажёр. Вы сможете выбрать ноты, интервалы или аккорды.',
//       targetSelector: '.add-card',
//       side: 'top',
//     },
//     {
//       title: '📊 Статистика',
//       text: 'Здесь вы можете увидеть свою точность по нотам, интервалам и аккордам, а также общую статистику тренировок.',
//       targetSelector: '.nav-icon:nth-child(2)',
//       side: 'top',
//     },
//     {
//       title: '🌍 Галерея',
//       text: 'В галерее собраны публичные тренажёры других пользователей. Вы можете проходить их и оценивать.',
//       targetSelector: '.nav-icon:nth-child(3)',
//       side: 'top',
//     },
//     {
//       title: '👤 Профиль',
//       text: 'В профиле вы видите свои достижения, можете редактировать информацию и настраивать аватар.',
//       targetSelector: '.nav-icon:nth-child(4)',
//       side: 'top',
//     },
//     {
//       title: '✨ Готово!',
//       text: 'Теперь вы знаете основы. Приятного обучения! Если что-то забудете, нажмите "Обучение" в профиле.',
//       targetSelector: null,
//       side: 'center',
//     },
//   ];

//   const currentStep = steps[step];

//   useEffect(() => {
//     if (currentStep.targetSelector) {
//       const element = document.querySelector(currentStep.targetSelector);
//       if (element) {
//         const rect = element.getBoundingClientRect();
//         setTargetRect(rect);
//       } else {
//         setTargetRect(null);
//       }
//     } else {
//       setTargetRect(null);
//     }
//   }, [step, currentStep.targetSelector]);

//   const nextStep = () => {
//     if (step + 1 < steps.length) {
//       setStep(step + 1);
//     } else {
//       onComplete();
//     }
//   };

//   const handleSkip = () => {
//     onComplete();
//   };

//   const isCenter = currentStep.side === 'center' || !targetRect;

//   let cardStyle = {};
//   if (!isCenter && targetRect) {
//     if (currentStep.side === 'bottom') {
//       cardStyle = {
//         top: targetRect.bottom + 15,
//         left: targetRect.left + targetRect.width / 2,
//         transform: 'translateX(-50%)',
//       };
//     } else if (currentStep.side === 'top') {
//       cardStyle = {
//         bottom: window.innerHeight - targetRect.top + 15,
//         left: targetRect.left + targetRect.width / 2,
//         transform: 'translateX(-50%)',
//       };
//     }
//   }

//   return (
//     <div className="onboarding-overlay">
//       {targetRect && !isCenter && (
//         <div
//           className="onboarding-highlight"
//           style={{
//             top: targetRect.top - 8,
//             left: targetRect.left - 8,
//             width: targetRect.width + 16,
//             height: targetRect.height + 16,
//           }}
//         />
//       )}
//       <div
//         className={`onboarding-card ${isCenter ? 'center' : currentStep.side}`}
//         style={cardStyle}
//       >
//         <h3>{currentStep.title}</h3>
//         <p>{currentStep.text}</p>
//         <div className="onboarding-buttons">
//           <button className="onboarding-skip" onClick={handleSkip}>
//             Пропустить
//           </button>
//           <button className="onboarding-next" onClick={nextStep}>
//             {step + 1 === steps.length ? 'Завершить' : 'Далее'}
//           </button>
//         </div>
//         <div className="onboarding-dots">
//           {steps.map((_, idx) => (
//             <span key={idx} className={`dot ${idx === step ? 'active' : ''}`} />
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OnboardingTour;