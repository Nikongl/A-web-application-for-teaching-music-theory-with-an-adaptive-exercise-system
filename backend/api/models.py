from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone

class UserManager(BaseUserManager):
    def create_user(self, email, username=None, password=None, **extra_fields):
        if not email:
            raise ValueError('Email обязателен')
        email = self.normalize_email(email)
        if username is None:
            username = email.split('@')[0]
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, username, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=150, unique=True, blank=True)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    
    level = models.IntegerField(default=1, validators=[MinValueValidator(1), MaxValueValidator(100)])
    experience_points = models.IntegerField(default=0)
    daily_goal = models.IntegerField(default=10)
    avatar = models.URLField(blank=True, null=True)
    bio = models.TextField(blank=True, max_length=500)
    is_premium = models.BooleanField(default=False)
    last_active = models.DateTimeField(default=timezone.now)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    objects = UserManager()
    
    class Meta:
        verbose_name = "Пользователь"
        verbose_name_plural = "Пользователи"
        indexes = [models.Index(fields=['email']), models.Index(fields=['level'])]
    
    def __str__(self):
        return f"{self.email} (ур.{self.level})"
    
    def add_experience(self, points):
        self.experience_points += points
        new_level = self.experience_points // 100 + 1
        if new_level > self.level:
            self.level = min(new_level, 100)
        self.save()

class ExerciseType(models.Model):
    name = models.CharField(max_length=50, unique=True)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, default="🎵")
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.icon} {self.name}"

class DifficultyLevel(models.Model):
    name = models.CharField(max_length=50, unique=True)
    code = models.CharField(max_length=20, unique=True)
    value = models.IntegerField(default=1)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=20, default="green")
    
    def __str__(self):
        return self.name

# api/models.py (фрагмент класса ExerciseConfig)
class ExerciseConfig(models.Model):
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_configs')
    # Старое поле (временно, для миграции)
    exercise_type = models.ForeignKey(ExerciseType, on_delete=models.SET_NULL, null=True, blank=True, related_name='old_configs')
    # Новое поле ManyToMany
    exercise_types = models.ManyToManyField(ExerciseType, related_name='configs')
    type_settings = models.JSONField(default=dict, help_text='Настройки для каждого типа')
    difficulty = models.ForeignKey(DifficultyLevel, on_delete=models.PROTECT, related_name='configs')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, max_length=500)
    settings = models.JSONField(default=dict)  # общие настройки (октавы и т.д.)
    questions_per_session = models.IntegerField(default=10, validators=[MinValueValidator(1), MaxValueValidator(50)])
    time_limit_seconds = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_public = models.BooleanField(default=False)
    times_used = models.IntegerField(default=0)
    likes = models.ManyToManyField(User, related_name='liked_configs', blank=True)
    # ... остальное без изменений
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.exercise_type.name})"
    
    @property
    def likes_count(self):
        return self.likes.count()

class ExerciseSession(models.Model):
    STATUS_CHOICES = [('in_progress', 'В процессе'), ('completed', 'Завершено'), ('abandoned', 'Брошено')]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exercise_sessions')
    config = models.ForeignKey(ExerciseConfig, on_delete=models.CASCADE, related_name='sessions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    total_questions = models.IntegerField(default=0)
    answered_questions = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)
    
    @property
    def accuracy(self):
        if self.answered_questions == 0:
            return 0
        return (self.correct_answers / self.answered_questions) * 100

class Question(models.Model):
    session = models.ForeignKey(ExerciseSession, on_delete=models.CASCADE, related_name='questions')
    question_data = models.JSONField()
    correct_answer = models.JSONField()
    user_answer = models.JSONField(null=True, blank=True)
    is_correct = models.BooleanField(null=True, blank=True)
    time_spent_seconds = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    answered_at = models.DateTimeField(null=True, blank=True)

class UserProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='detailed_progress')
    exercise_type = models.ForeignKey(ExerciseType, on_delete=models.CASCADE, related_name='user_progress')
    element_key = models.CharField(max_length=50)
    element_name = models.CharField(max_length=100)
    total_attempts = models.IntegerField(default=0)
    correct_attempts = models.IntegerField(default=0)
    last_attempted = models.DateTimeField(auto_now=True)
    mastery_level = models.FloatField(default=0.0)
    next_review_date = models.DateTimeField(default=timezone.now)
    
    class Meta:
        unique_together = ['user', 'exercise_type', 'element_key']

class Achievement(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField()
    icon = models.CharField(max_length=50, default="🏆")
    condition_type = models.CharField(max_length=50)
    condition_value = models.IntegerField()

class UserAchievement(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ['user', 'achievement']