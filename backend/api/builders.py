# builders.py
from .models import ExerciseConfig

class ExerciseConfigBuilder:
    """Построитель для сложной конфигурации упражнения."""
    
    def __init__(self, creator, exercise_type, difficulty):
        self.config = ExerciseConfig(
            creator=creator,
            exercise_type=exercise_type,
            difficulty=difficulty
        )
        self.config.name = ""
        self.config.description = ""
        self.config.settings = {}
        self.config.questions_per_session = 10
        self.config.is_public = False
    
    def set_name(self, name):
        self.config.name = name
        return self
    
    def set_description(self, description):
        self.config.description = description
        return self
    
    def set_settings(self, settings):
        self.config.settings = settings
        return self
    
    def set_questions_per_session(self, count):
        self.config.questions_per_session = count
        return self
    
    def set_public(self, is_public):
        self.config.is_public = is_public
        return self
    
    def build(self):
        """Сохраняет конфигурацию в БД и возвращает объект."""
        self.config.save()
        return self.config