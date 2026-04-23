import React, { createContext, useState, useContext } from 'react';

const TourContext = createContext();

export const useTour = () => useContext(TourContext);

export const TourProvider = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetPage, setTargetPage] = useState('/');
  const [targetSelector, setTargetSelector] = useState(null);
  const [tourSteps, setTourSteps] = useState([]);
  const [waitingForClick, setWaitingForClick] = useState(false);

  const startTour = (steps) => {
    setTourSteps(steps);
    setIsActive(true);
    setCurrentStep(0);
    const firstStep = steps[0];
    setTargetPage(firstStep.page);
    setTargetSelector(firstStep.selector);
    setWaitingForClick(firstStep.interactive || false);
  };

  const nextStep = () => {
    const next = currentStep + 1;
    if (next < tourSteps.length) {
      setCurrentStep(next);
      const step = tourSteps[next];
      setTargetPage(step.page);
      setTargetSelector(step.selector);
      setWaitingForClick(step.interactive || false);
    } else {
      setIsActive(false);
      setTourSteps([]);
      setCurrentStep(0);
      setWaitingForClick(false);
    }
  };

  const stopTour = () => {
    setIsActive(false);
    setTourSteps([]);
    setCurrentStep(0);
    setWaitingForClick(false);
  };

  return (
    <TourContext.Provider value={{
      isActive,
      currentStep,
      targetPage,
      targetSelector,
      tourSteps,
      waitingForClick,
      startTour,
      nextStep,
      stopTour,
    }}>
      {children}
    </TourContext.Provider>
  );
};