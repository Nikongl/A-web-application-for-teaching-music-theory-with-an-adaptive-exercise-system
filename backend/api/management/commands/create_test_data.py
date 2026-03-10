# api/management/commands/create_test_data.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import (
    ExerciseType, DifficultyLevel, ExerciseConfig, 
    ExerciseSession, Question, UserProgress, Achievement, UserAchievement
)
from django.utils import timezone
import random
from datetime import timedelta

User = get_user_model()

class Command(BaseCommand):
    help = 'Создание тестовых данных для разработки'

    def handle(self, *args, **kwargs):
        self.stdout.write('Создание тестовых данных...')
        
        # Создаем тестового пользователя
        test_user, created = User.objects.get_or_create(
            username='testuser',
            defaults={
                'email': 'test@example.com',
                'level': 5,
                'experience_points': 450,
                'bio': 'Я тестовый пользователь, люблю музыку!',
                'is_premium': True
            }
        )
        if created:
            test_user.set_password('testpass123')
            test_user.save()
            self.stdout.write(self.style.SUCCESS('Создан тестовый пользователь: testuser / testpass123'))
        
        # Создаем еще одного пользователя
        beginner_user, created = User.objects.get_or_create(
            username='beginner',
            defaults={
                'email': 'beginner@example.com',
                'level': 1,
                'experience_points': 50,
                'bio': 'Только начинаю учить музыку',
                'is_premium': False
            }
        )
        if created:
            beginner_user.set_password('beginner123')
            beginner_user.save()
            self.stdout.write('Создан пользователь: beginner')
        
        # Получаем типы упражнений и сложности
        note_type = ExerciseType.objects.get(code='notes')
        interval_type = ExerciseType.objects.get(code='intervals')
        chord_type = ExerciseType.objects.get(code='chords')
        
        beginner_diff = DifficultyLevel.objects.get(code='beginner')
        intermediate_diff = DifficultyLevel.objects.get(code='intermediate')
        
        # Создаем конфигурации упражнений
        configs = [
            {
                'creator': test_user,
                'exercise_type': note_type,
                'difficulty': beginner_diff,
                'name': 'Ноты в первой октаве',
                'description': 'Учим ноты от до до си в первой октаве',
                'settings': {
                    'min_octave': 4,
                    'max_octave': 4,
                    'notes': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
                    'accidentals': False
                },
                'questions_per_session': 10,
                'is_public': True
            },
            {
                'creator': test_user,
                'exercise_type': interval_type,
                'difficulty': intermediate_diff,
                'name': 'Все интервалы',
                'description': 'Тренируем все интервалы в пределах октавы',
                'settings': {
                    'min_interval': 1,
                    'max_interval': 8,
                    'quality': ['major', 'minor', 'perfect', 'augmented', 'diminished']
                },
                'questions_per_session': 15,
                'is_public': True
            },
            {
                'creator': beginner_user,
                'exercise_type': chord_type,
                'difficulty': beginner_diff,
                'name': 'Основные аккорды',
                'description': 'Мажорные и минорные аккорды',
                'settings': {
                    'chord_types': ['major', 'minor'],
                    'inversions': False
                },
                'questions_per_session': 8,
                'is_public': False
            }
        ]
        
        created_configs = []
        for config_data in configs:
            config, created = ExerciseConfig.objects.get_or_create(
                name=config_data['name'],
                creator=config_data['creator'],
                defaults=config_data
            )
            created_configs.append(config)
            if created:
                self.stdout.write(f'Создана конфигурация: {config.name}')
        
        # Создаем сессии и вопросы
        for user in [test_user, beginner_user]:
            for config in created_configs[:2]:  # Берем первые две конфигурации
                # Создаем 3 сессии для каждого пользователя
                for i in range(3):
                    session = ExerciseSession.objects.create(
                        user=user,
                        config=config,
                        status=random.choice(['completed', 'completed', 'in_progress']),
                        started_at=timezone.now() - timedelta(days=random.randint(0, 30)),
                        completed_at=timezone.now() - timedelta(days=random.randint(0, 10)) if random.random() > 0.3 else None,
                        total_questions=10,
                        answered_questions=random.randint(5, 10),
                        correct_answers=random.randint(3, 9)
                    )
                    
                    # Создаем вопросы для сессии
                    for q_num in range(session.answered_questions):
                        is_correct = random.random() > 0.3
                        Question.objects.create(
                            session=session,
                            question_data={'note': random.choice(['C', 'D', 'E', 'F', 'G']), 'octave': 4},
                            correct_answer={'name': 'C4'},
                            user_answer={'name': 'C4'} if is_correct else {'name': 'D4'},
                            is_correct=is_correct,
                            time_spent_seconds=random.randint(2, 15),
                            answered_at=session.started_at + timedelta(minutes=q_num)
                        )
                    
                    self.stdout.write(f'Создана сессия #{session.id} для {user.username}')
        
        # Создаем прогресс пользователя
        elements = [
            ('C4', 'До первой октавы'),
            ('D4', 'Ре первой октавы'),
            ('E4', 'Ми первой октавы'),
            ('major_third', 'Большая терция'),
            ('perfect_fifth', 'Чистая квинта'),
            ('C_major', 'До мажор'),
        ]
        
        for element_key, element_name in elements:
            for user in [test_user, beginner_user]:
                progress, created = UserProgress.objects.get_or_create(
                    user=user,
                    exercise_type=note_type if 'C4' in element_key else interval_type,
                    element_key=element_key,
                    defaults={
                        'element_name': element_name,
                        'total_attempts': random.randint(5, 50),
                        'correct_attempts': random.randint(2, 40),
                        'mastery_level': random.random() * 0.8 + 0.2
                    }
                )
        
        # Выдаем достижения
        achievements = Achievement.objects.all()
        for user in [test_user, beginner_user]:
            # Даем 2-3 случайных достижения
            for achievement in random.sample(list(achievements), k=random.randint(2, 3)):
                UserAchievement.objects.get_or_create(
                    user=user,
                    achievement=achievement
                )
        
        self.stdout.write(self.style.SUCCESS('✅ Тестовые данные успешно созданы!'))
        self.stdout.write('=' * 50)
        self.stdout.write('Данные для входа:')
        self.stdout.write('  testuser / testpass123')
        self.stdout.write('  beginner / beginner123')
        self.stdout.write('=' * 50)