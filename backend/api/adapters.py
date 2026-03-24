# adapters.py
import json
from .models import ExerciseConfig

class ExerciseConfigJSONAdapter:
    """Адаптирует ExerciseConfig к JSON-представлению для экспорта."""
    
    def __init__(self, config):
        self.config = config
    
    def to_json(self):
        """Возвращает JSON-строку с данными конфигурации."""
        data = {
            'id': self.config.id,
            'name': self.config.name,
            'exercise_type': self.config.exercise_type.code,
            'difficulty': self.config.difficulty.code,
            'settings': self.config.settings,
            'questions_count': self.config.questions_per_session,
            'creator': self.config.creator.username,
        }
        return json.dumps(data, ensure_ascii=False, indent=2)
    
    @classmethod
    def from_json(cls, json_str, creator, exercise_type, difficulty):
        """Создаёт конфигурацию из JSON."""
        data = json.loads(json_str)
        config = ExerciseConfig(
            creator=creator,
            exercise_type=exercise_type,
            difficulty=difficulty,
            name=data['name'],
            settings=data.get('settings', {}),
            questions_per_session=data.get('questions_count', 10),
            is_public=False
        )
        config.save()
        return config