# proxies.py
from .models import ExerciseConfig

class ExerciseConfigProxy:
    """Proxy для ленивой загрузки связанных объектов."""
    
    def __init__(self, config_id):
        self.config_id = config_id
        self._config = None
    
    def _load(self):
        if self._config is None:
            self._config = ExerciseConfig.objects.select_related(
                'creator', 'exercise_type', 'difficulty'
            ).get(id=self.config_id)
    
    @property
    def name(self):
        self._load()
        return self._config.name
    
    @property
    def creator_username(self):
        self._load()
        return self._config.creator.username
    
    @property
    def exercise_type_name(self):
        self._load()
        return self._config.exercise_type.name
    
    # можно добавить другие поля
    def __getattr__(self, name):
        self._load()
        return getattr(self._config, name)