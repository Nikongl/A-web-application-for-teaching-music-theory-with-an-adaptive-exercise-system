# strategies.py
from abc import ABC, abstractmethod

class ExperienceStrategy(ABC):
    """Стратегия начисления опыта."""
    
    @abstractmethod
    def calculate(self, correct_answer, time_spent, difficulty):
        pass

class SimpleExperienceStrategy(ExperienceStrategy):
    """Простая стратегия: фиксированные очки."""
    
    def calculate(self, correct_answer, time_spent, difficulty):
        return 10 if correct_answer else 2

class DifficultyExperienceStrategy(ExperienceStrategy):
    """Стратегия с учётом сложности."""
    
    def calculate(self, correct_answer, time_spent, difficulty):
        base = 5 if correct_answer else 1
        multiplier = difficulty.value  # например, от 1 до 5
        return base * multiplier

class TimeBonusExperienceStrategy(ExperienceStrategy):
    """Стратегия с бонусом за быстроту."""
    
    def calculate(self, correct_answer, time_spent, difficulty):
        if not correct_answer:
            return 0
        # Чем быстрее ответ, тем больше очков
        if time_spent < 5:
            return 20
        elif time_spent < 10:
            return 15
        else:
            return 10