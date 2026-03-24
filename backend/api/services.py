# services.py
from .strategies import SimpleExperienceStrategy

class ExperienceService:
    """Сервис для начисления опыта с возможностью смены стратегии."""
    
    def __init__(self, strategy=None):
        self.strategy = strategy or SimpleExperienceStrategy()
    
    def set_strategy(self, strategy):
        self.strategy = strategy
    
    def award_experience(self, user, correct, time_spent, difficulty):
        points = self.strategy.calculate(correct, time_spent, difficulty)
        user.add_experience(points)
        return points