import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTour } from './TourContext';
import './GlobalTour.css';

const GlobalTour = () => {
  const { isActive, currentStep, targetPage, targetSelector, tourSteps, waitingForClick, nextStep, stopTour } = useTour();
  const location = useLocation();
  const navigate = useNavigate();
  const [targetRect, setTargetRect] = useState(null);
  const [waitingForPageLoad, setWaitingForPageLoad] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [elementNotFound, setElementNotFound] = useState(false);
  const cardRef = useRef(null);

  // Переключение страницы
  useEffect(() => {
    if (!isActive) return;
    if (location.pathname !== targetPage) {
      setWaitingForPageLoad(true);
      setPageReady(false);
      setElementNotFound(false);
      navigate(targetPage);
    } else {
      setWaitingForPageLoad(false);
      setTimeout(() => setPageReady(true), 300);
    }
  }, [isActive, targetPage, location.pathname, navigate]);

  // Поиск элемента и установка подсветки
  useEffect(() => {
    if (!isActive || waitingForPageLoad || !pageReady) return;
    const currentStepData = tourSteps[currentStep];
    if (currentStepData?.selector) {
      const element = document.querySelector(currentStepData.selector);
      if (element) {
        setElementNotFound(false);
        // Прокручиваем к элементу
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Небольшая задержка для завершения прокрутки
        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          setTargetRect(rect);
        }, 200);
      } else {
        setElementNotFound(true);
        setTargetRect(null);
      }
    } else {
      setElementNotFound(false);
      setTargetRect(null);
    }
  }, [isActive, waitingForPageLoad, pageReady, currentStep, tourSteps]);

  // Ожидание клика на интерактивном шаге
  useEffect(() => {
    if (!isActive || waitingForPageLoad || !pageReady || !waitingForClick) return;
    const currentStepData = tourSteps[currentStep];
    if (!currentStepData?.selector) return;
    
    const element = document.querySelector(currentStepData.selector);
    if (!element) return;

    const handler = (e) => {
      if (element === e.target || element.contains(e.target)) {
        document.removeEventListener('click', handler);
        nextStep();
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [isActive, waitingForPageLoad, pageReady, waitingForClick, currentStep, tourSteps, nextStep]);

  if (!isActive) return null;

  const currentStepData = tourSteps[currentStep];
  if (!currentStepData) return null;

  // Определяем позицию карточки
  let cardStyle = {};
  let isCenter = !targetRect || elementNotFound;

  if (!isCenter && targetRect) {
    const viewportHeight = window.innerHeight;
    const elementTop = targetRect.top;
    const elementBottom = targetRect.bottom;
    const cardHeight = 240; // примерная высота карточки
    let topPos;

    // Если элемент внизу экрана, карточку ставим сверху от элемента
    if (elementBottom > viewportHeight - 100) {
      topPos = elementTop - cardHeight - 15;
      // Если сверху не хватает места, ставим снизу с ограничением
      if (topPos < 10) topPos = elementBottom + 15;
    } 
    // Если элемент вверху экрана, карточку ставим снизу
    else if (elementTop < 100) {
      topPos = elementBottom + 15;
    }
    // Иначе стандартно снизу
    else {
      topPos = elementBottom + 15;
    }

    // Центрирование по горизонтали с проверкой границ
    let leftPos = targetRect.left + targetRect.width / 2;
    const cardWidth = 300;
    const minLeft = cardWidth / 2 + 10;
    const maxLeft = window.innerWidth - cardWidth / 2 - 10;
    if (leftPos < minLeft) leftPos = minLeft;
    if (leftPos > maxLeft) leftPos = maxLeft;

    cardStyle = {
      top: topPos,
      left: leftPos,
      transform: 'translateX(-50%)',
    };
  }

  // Если элемент не найден, показываем карточку по центру
  if (elementNotFound && currentStepData.selector) {
    isCenter = true;
  }

  return (
    <div className="global-tour-overlay">
      {targetRect && !elementNotFound && (
        <div
          className="global-tour-highlight"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}
      <div
        ref={cardRef}
        className={`global-tour-card ${isCenter ? 'center' : ''}`}
        style={isCenter ? {} : cardStyle}
      >
        <h3>{currentStepData.title}</h3>
        <p>{currentStepData.text}</p>
        {elementNotFound && currentStepData.selector && (
          <p style={{ color: '#f44336', fontSize: '12px', marginTop: '8px' }}>
            ⚠️ Элемент не найден, но вы можете нажать "Далее", чтобы продолжить.
          </p>
        )}
        <div className="global-tour-buttons">
          <button className="global-tour-skip" onClick={stopTour}>Пропустить</button>
          {(!waitingForClick || elementNotFound) && (
            <button className="global-tour-next" onClick={nextStep}>
              {currentStep + 1 === tourSteps.length ? 'Завершить' : 'Далее'}
            </button>
          )}
        </div>
        <div className="global-tour-dots">
          {tourSteps.map((_, idx) => (
            <span key={idx} className={`dot ${idx === currentStep ? 'active' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GlobalTour;