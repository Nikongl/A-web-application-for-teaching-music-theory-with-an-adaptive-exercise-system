from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import models
from .models import ExerciseSession, User, Achievement, UserAchievement, UserProgress
from .views import check_and_grant_achievements  # импортируем общую функцию

@receiver(post_save, sender=ExerciseSession)
def handle_session_completion(sender, instance, created, **kwargs):
    print(f"🔔 Сигнал: сессия {instance.id}, created={created}, статус={instance.status}")
    if not created and instance.status == 'completed':
        user = instance.user
        print(f"🎉 Сессия завершена! Пользователь {user.email}, правильных ответов: {instance.correct_answers}")
        
        # Начисление опыта
        xp_earned = instance.correct_answers * 10
        if xp_earned > 0:
            user.add_experience(xp_earned)
            print(f"💰 Начислено {xp_earned} XP")
        
        # Выдача достижений через общую функцию
        check_and_grant_achievements(user)
    else:
        print(f"⏭️ Сигнал проигнорирован (статус не 'completed' или создана новая сессия)")