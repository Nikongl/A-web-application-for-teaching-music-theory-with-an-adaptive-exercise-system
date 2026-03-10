from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

class User(AbstractUser):
    """Кастомная модель пользователя"""
    level = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        verbose_name="Уровень"
    )
    experience_points = models.IntegerField(
        default=0,
        verbose_name="Опыт"
    )
    daily_goal = models.IntegerField(
        default=10,
        verbose_name="Дневная цель (упражнений)"
    )
    avatar = models.URLField(
        blank=True,
        null=True,
        verbose_name="Аватар"
    )
    bio = models.TextField(
        blank=True,
        max_length=500,
        verbose_name="О себе"
    )
    is_premium = models.BooleanField(
        default=False,
        verbose_name="Премиум доступ"
    )
    last_active = models.DateTimeField(
        default=timezone.now,
        verbose_name="Последняя активность"
    )
    
    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['email']),
            models.Index(fields=['level']),
        ]
    
    def __str__(self):
        return f"{self.username} (ур.{self.level})"
    
    def add_experience(self, points):
        """Добавление опыта и повышение уровня"""
        self.experience_points += points
        # Каждые 100 очков - новый уровень
        new_level = self.experience_points // 100 + 1
        if new_level > self.level:
            self.level = min(new_level, 100)
        self.save()


class ExerciseType(models.Model):
    """Типы упражнений"""
    name = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Название"
    )
    code = models.CharField(
        max_length=20,
        unique=True,
        verbose_name="Код (для API)",
        # blank=True,  # ВРЕМЕННО: разрешаем пустые значения
        # null=True    # ВРЕМЕННО: разрешаем NULL в базе
    )
    description = models.TextField(
        blank=True,
        verbose_name="Описание"
    )
    icon = models.CharField(
        max_length=50,
        default="🎵",
        verbose_name="Иконка"
    )
    order = models.IntegerField(
        default=0,
        verbose_name="Порядок отображения"
    )
    
    class Meta:
        verbose_name = "Тип упражнения"
        verbose_name_plural = "Типы упражнений"
        ordering = ['order']
    
    def __str__(self):
        return f"{self.icon} {self.name}"
    
    def save(self, *args, **kwargs):
        """
        Переопределяем save, чтобы автоматически заполнять code из name,
        если code не указан
        """
        if not self.code and self.name:
            # Конвертируем русское название в английский код
            # Простой вариант: заменяем пробелы на подчеркивания и приводим к нижнему регистру
            translit_map = {
                'Ноты': 'notes',
                'Интервалы': 'intervals',
                'Аккорды': 'chords',
                'Ритм': 'rhythm',
                'Нота': 'note',
                'Интервал': 'interval',
                'Аккорд': 'chord',
            }
            # Если есть прямое соответствие, используем его
            if self.name in translit_map:
                self.code = translit_map[self.name]
            else:
                # Иначе делаем транслитерацию (упрощенно)
                self.code = self.name.lower().replace(' ', '_')
        super().save(*args, **kwargs)

class DifficultyLevel(models.Model):
    """Уровни сложности"""
    name = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Название"
    )
    code = models.CharField(
        max_length=20,
        unique=True,
        verbose_name="Код"
    )
    value = models.IntegerField(
        default=1,
        verbose_name="Числовое значение"
    )
    description = models.TextField(
        blank=True,
        verbose_name="Описание"
    )
    color = models.CharField(
        max_length=20,
        default="green",
        verbose_name="Цвет в интерфейсе"
    )
    
    class Meta:
        verbose_name = "Уровень сложности"
        verbose_name_plural = "Уровни сложности"
    
    def __str__(self):
        return self.name


class ExerciseConfig(models.Model):
    """Конфигурация упражнения"""
    creator = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_configs',
        verbose_name="Создатель"
    )
    exercise_type = models.ForeignKey(
        ExerciseType,
        on_delete=models.CASCADE,
        related_name='configs',
        verbose_name="Тип упражнения"
    )
    difficulty = models.ForeignKey(
        DifficultyLevel,
        on_delete=models.PROTECT,
        related_name='configs',
        verbose_name="Сложность"
    )
    name = models.CharField(
        max_length=100,
        verbose_name="Название конфигурации"
    )
    description = models.TextField(
        blank=True,
        max_length=500,
        verbose_name="Описание"
    )
    
    # Параметры генерации
    settings = models.JSONField(
        default=dict,
        verbose_name="Настройки",
        help_text="""
        Пример для нот: {"min_octave": 2, "max_octave": 5, "notes": ["C", "D", "E", "F", "G", "A", "B"]}
        Для интервалов: {"min_interval": 1, "max_interval": 8, "quality": ["major", "minor", "perfect"]}
        Для аккордов: {"chord_types": ["major", "minor", "diminished", "augmented"]}
        """
    )
    
    # Настройки выполнения
    questions_per_session = models.IntegerField(
        default=10,
        validators=[MinValueValidator(1), MaxValueValidator(50)],
        verbose_name="Вопросов за сессию"
    )
    time_limit_seconds = models.IntegerField(
        default=0,
        help_text="0 = без ограничения",
        verbose_name="Лимит времени"
    )
    
    # Метаданные
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Дата создания"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Дата обновления"
    )
    is_public = models.BooleanField(
        default=False,
        verbose_name="Публичный доступ"
    )
    times_used = models.IntegerField(
        default=0,
        verbose_name="Количество использований"
    )
    likes = models.ManyToManyField(
        User,
        related_name='liked_configs',
        blank=True,
        verbose_name="Лайки"
    )
    
    class Meta:
        verbose_name = "Конфигурация упражнения"
        verbose_name_plural = "Конфигурации упражнений"
        indexes = [
            models.Index(fields=['created_at']),
            models.Index(fields=['is_public']),
            models.Index(fields=['exercise_type', 'difficulty']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.exercise_type.name})"
    
    @property
    def likes_count(self):
        return self.likes.count()


class ExerciseSession(models.Model):
    """Сессия выполнения упражнения"""
    STATUS_CHOICES = [
        ('in_progress', 'В процессе'),
        ('completed', 'Завершено'),
        ('abandoned', 'Брошено'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='exercise_sessions',
        verbose_name="Пользователь"
    )
    config = models.ForeignKey(
        ExerciseConfig,
        on_delete=models.CASCADE,
        related_name='sessions',
        verbose_name="Конфигурация"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='in_progress',
        verbose_name="Статус"
    )
    started_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Начало"
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Завершение"
    )
    
    # Статистика сессии
    total_questions = models.IntegerField(
        default=0,
        verbose_name="Всего вопросов"
    )
    answered_questions = models.IntegerField(
        default=0,
        verbose_name="Отвечено"
    )
    correct_answers = models.IntegerField(
        default=0,
        verbose_name="Правильных"
    )
    
    class Meta:
        verbose_name = "Сессия упражнения"
        verbose_name_plural = "Сессии упражнений"
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['started_at']),
        ]
        ordering = ['-started_at']
    
    def __str__(self):
        return f"Сессия {self.user.username} - {self.started_at.strftime('%d.%m.%Y %H:%M')}"
    
    @property
    def accuracy(self):
        """Точность в процентах"""
        if self.answered_questions == 0:
            return 0
        return (self.correct_answers / self.answered_questions) * 100


class Question(models.Model):
    """Сгенерированный вопрос"""
    session = models.ForeignKey(
        ExerciseSession,
        on_delete=models.CASCADE,
        related_name='questions',
        verbose_name="Сессия"
    )
    question_data = models.JSONField(
        verbose_name="Данные вопроса",
        help_text="Содержит ноты, интервалы и т.д."
    )
    correct_answer = models.JSONField(
        verbose_name="Правильный ответ"
    )
    user_answer = models.JSONField(
        null=True,
        blank=True,
        verbose_name="Ответ пользователя"
    )
    is_correct = models.BooleanField(
        null=True,
        blank=True,
        verbose_name="Правильно?"
    )
    time_spent_seconds = models.IntegerField(
        default=0,
        verbose_name="Время на ответ"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Время создания"
    )
    answered_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Время ответа"
    )
    
    class Meta:
        verbose_name = "Вопрос"
        verbose_name_plural = "Вопросы"
        indexes = [
            models.Index(fields=['session', 'is_correct']),
        ]
        ordering = ['created_at']
    
    def __str__(self):
        return f"Вопрос #{self.id} для {self.session}"


class UserProgress(models.Model):
    """Детальная статистика пользователя по каждому типу/элементу"""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='detailed_progress',
        verbose_name="Пользователь"
    )
    exercise_type = models.ForeignKey(
        ExerciseType,
        on_delete=models.CASCADE,
        verbose_name="Тип упражнения"
    )
    
    # Для нот: "C4", для интервалов: "minor_third", для аккордов: "C_major"
    element_key = models.CharField(
        max_length=50,
        verbose_name="Ключ элемента"
    )
    element_name = models.CharField(
        max_length=100,
        verbose_name="Название элемента"
    )
    
    # Статистика
    total_attempts = models.IntegerField(
        default=0,
        verbose_name="Всего попыток"
    )
    correct_attempts = models.IntegerField(
        default=0,
        verbose_name="Правильных"
    )
    last_attempted = models.DateTimeField(
        auto_now=True,
        verbose_name="Последняя попытка"
    )
    
    # Для адаптивности
    mastery_level = models.FloatField(
        default=0.0,
        verbose_name="Уровень освоения",
        help_text="0.0 - 1.0"
    )
    next_review_date = models.DateTimeField(
        default=timezone.now,
        verbose_name="Дата следующего повторения"
    )
    
    class Meta:
        verbose_name = "Прогресс пользователя"
        verbose_name_plural = "Прогресс пользователей"
        unique_together = ['user', 'exercise_type', 'element_key']
        indexes = [
            models.Index(fields=['user', 'mastery_level']),
            models.Index(fields=['next_review_date']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.element_name}: {self.mastery_level:.1%}"
    
    @property
    def success_rate(self):
        if self.total_attempts == 0:
            return 0
        return (self.correct_attempts / self.total_attempts) * 100
    
    def update_mastery(self, was_correct):
        """Обновление уровня освоения (алгоритм адаптивности)"""
        self.total_attempts += 1
        if was_correct:
            self.correct_attempts += 1
        
        # Простой алгоритм: мастерство = процент успеха
        self.mastery_level = self.correct_attempts / self.total_attempts
        
        # Планирование следующего повторения (чем выше мастерство, тем реже)
        days_until_review = max(1, int((1 - self.mastery_level) * 10))
        self.next_review_date = timezone.now() + timezone.timedelta(days=days_until_review)
        self.save()


class Achievement(models.Model):
    """Достижения"""
    name = models.CharField(
        max_length=100,
        verbose_name="Название"
    )
    code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Код"
    )
    description = models.TextField(
        verbose_name="Описание"
    )
    icon = models.CharField(
        max_length=50,
        default="🏆",
        verbose_name="Иконка"
    )
    condition_type = models.CharField(
        max_length=50,
        verbose_name="Тип условия",
        help_text="total_sessions, correct_answers, streak, etc."
    )
    condition_value = models.IntegerField(
        verbose_name="Значение условия"
    )
    
    class Meta:
        verbose_name = "Достижение"
        verbose_name_plural = "Достижения"
    
    def __str__(self):
        return self.name


class UserAchievement(models.Model):
    """Достижения пользователя"""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='achievements',
        verbose_name="Пользователь"
    )
    achievement = models.ForeignKey(
        Achievement,
        on_delete=models.CASCADE,
        verbose_name="Достижение"
    )
    earned_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Получено"
    )
    
    class Meta:
        verbose_name = "Достижение пользователя"
        verbose_name_plural = "Достижения пользователей"
        unique_together = ['user', 'achievement']
    
    def __str__(self):
        return f"{self.user.username} - {self.achievement.name}"