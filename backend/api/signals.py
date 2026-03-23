# signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, ExerciseSession, Achievement, UserAchievement

@receiver(post_save, sender=ExerciseSession)
def check_achievements_on_session_complete(sender, instance, created, **kwargs):
    """Наблюдатель: при завершении сессии проверяем достижения."""
    if not created and instance.status == 'completed':
        user = instance.user
        # Проверяем, например, достижение за 10 сессий
        sessions_count = ExerciseSession.objects.filter(
            user=user, status='completed'
        ).count()
        if sessions_count >= 10:
            achievement = Achievement.objects.get(code='10_sessions')
            UserAchievement.objects.get_or_create(
                user=user, achievement=achievement
            )