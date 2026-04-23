from rest_framework.views import APIView
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta
from .models import ExerciseSession, UserProgress, User
from .models import Achievement, UserAchievement
from .serializers import UserProfileSerializer
from django.contrib.auth import get_user_model
from rest_framework.parsers import MultiPartParser, FormParser
import random
from .utils import INTERVALS, CHORD_TYPES, get_octave_range_from_difficulty, get_allowed_notes, generate_specific_interval, generate_specific_chord

from rest_framework import generics, permissions
from django.db import models
from .models import (
    ExerciseType, DifficultyLevel, ExerciseConfig, ExerciseSession, UserProgress,
    Achievement, UserAchievement
)
from .serializers import (
    ExerciseTypeSerializer, DifficultyLevelSerializer,
    ExerciseConfigSerializer, ExerciseSessionSerializer, UserProgressSerializer,
    AchievementSerializer, UserAchievementSerializer
)
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status

# ========== ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ВЫДАЧИ ДОСТИЖЕНИЙ ==========
def check_and_grant_achievements(user):
    print(f"🔍 Проверка достижений для пользователя {user.email}")
    total_sessions = ExerciseSession.objects.filter(user=user, status='completed').count()
    total_correct = ExerciseSession.objects.filter(user=user, status='completed').aggregate(
        total=models.Sum('correct_answers')
    )['total'] or 0
    notes_correct = UserProgress.objects.filter(user=user, exercise_type=1).aggregate(
        total=models.Sum('correct_attempts')
    )['total'] or 0
    intervals_correct = UserProgress.objects.filter(user=user, exercise_type=2).aggregate(
        total=models.Sum('correct_attempts')
    )['total'] or 0
    chord_types = ['Мажор', 'Минор']
    all_mastered = True
    for chord_name in chord_types:
        mastered = UserProgress.objects.filter(
            user=user, exercise_type=3, element_name__icontains=chord_name, mastery_level__gte=0.9
        ).exists()
        if not mastered:
            all_mastered = False
            break

    print(f"📊 total_sessions={total_sessions}, total_correct={total_correct}, notes_correct={notes_correct}, intervals_correct={intervals_correct}, all_mastered={all_mastered}")

    all_achievements = Achievement.objects.all()
    for ach in all_achievements:
        condition_met = False
        cond_type = ach.condition_type
        cond_val = ach.condition_value
        if cond_type == 'total_sessions' and total_sessions >= cond_val:
            condition_met = True
        elif cond_type == 'correct_answers' and total_correct >= cond_val:
            condition_met = True
        elif cond_type == 'level' and user.level >= cond_val:
            condition_met = True
        elif cond_type == 'correct_notes' and notes_correct >= cond_val:
            condition_met = True
        elif cond_type == 'correct_intervals' and intervals_correct >= cond_val:
            condition_met = True
        elif cond_type == 'chord_mastery' and all_mastered:
            condition_met = True

        if condition_met:
            obj, created = UserAchievement.objects.get_or_create(user=user, achievement=ach)
            if created:
                print(f"🏆 Выдано достижение: {ach.name} (код: {ach.code})")
            else:
                print(f"⏩ Достижение уже есть: {ach.name}")

# ========== СТАТИСТИКА ==========
class UserDetailedStatisticsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        check_and_grant_achievements(user)
        sessions = ExerciseSession.objects.filter(user=user, status='completed')
        total_sessions = sessions.count()
        total_answered = sessions.aggregate(total=Sum('answered_questions'))['total'] or 0
        total_correct = sessions.aggregate(total=Sum('correct_answers'))['total'] or 0
        overall_accuracy = round((total_correct / total_answered * 100) if total_answered > 0 else 0)
        progress_notes = UserProgress.objects.filter(user=user, exercise_type=1)
        progress_intervals = UserProgress.objects.filter(user=user, exercise_type=2)
        progress_chords = UserProgress.objects.filter(user=user, exercise_type=3)
        def serialize(progress_list):
            result = []
            for p in progress_list:
                accuracy = round((p.correct_attempts / p.total_attempts * 100) if p.total_attempts > 0 else 0, 1)
                result.append({
                    'name': p.element_name,
                    'accuracy': accuracy,
                    'attempts': p.total_attempts,
                    'correct': p.correct_attempts,
                    'wrong': p.total_attempts - p.correct_attempts
                })
            result.sort(key=lambda x: x['accuracy'])
            return result
        return Response({
            'total_sessions': total_sessions,
            'overall_accuracy': overall_accuracy,
            'user_level': user.level,
            'experience_points': user.experience_points,
            'weak_notes': serialize(progress_notes),
            'weak_intervals': serialize(progress_intervals),
            'weak_chords': serialize(progress_chords),
        })

class UserStatisticsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        sessions = ExerciseSession.objects.filter(user=user, status='completed')
        total_sessions = sessions.count()
        total_questions = sum(s.answered_questions for s in sessions)
        correct_questions = sum(s.correct_answers for s in sessions)
        overall_accuracy = round((correct_questions / total_questions * 100) if total_questions > 0 else 0)
        today = timezone.now().date()
        daily_labels = []
        daily_correct = []
        daily_total = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            daily_labels.append(day.strftime('%d.%m'))
            day_sessions = sessions.filter(started_at__date=day)
            day_correct = sum(s.correct_answers for s in day_sessions)
            day_total = sum(s.answered_questions for s in day_sessions)
            daily_correct.append(day_correct)
            daily_total.append(day_total)
        type_labels = ['Ноты', 'Интервалы', 'Аккорды']
        type_counts = [0, 0, 0]
        return Response({
            'total_sessions': total_sessions,
            'overall_accuracy': overall_accuracy,
            'user_level': user.level,
            'experience_points': user.experience_points,
            'daily_labels': daily_labels,
            'daily_correct': daily_correct,
            'daily_total': daily_total,
            'type_labels': type_labels,
            'type_counts': type_counts,
        })

class ExerciseTypeList(generics.ListCreateAPIView):
    queryset = ExerciseType.objects.all().order_by('order')
    serializer_class = ExerciseTypeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class ExerciseTypeDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = ExerciseType.objects.all()
    serializer_class = ExerciseTypeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class DifficultyLevelList(generics.ListAPIView):
    queryset = DifficultyLevel.objects.all()
    serializer_class = DifficultyLevelSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class ExerciseConfigList(generics.ListCreateAPIView):
    serializer_class = ExerciseConfigSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        return ExerciseConfig.objects.filter(
            models.Q(creator=user) | models.Q(is_public=True)
        ).distinct().order_by('-created_at')
    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

class ExerciseConfigDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExerciseConfigSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        return ExerciseConfig.objects.filter(
            models.Q(creator=user) | models.Q(is_public=True)
        ).distinct()
    def perform_update(self, serializer):
        if self.get_object().creator != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Вы не можете редактировать чужой тренажёр")
        serializer.save()
    def perform_destroy(self, instance):
        if instance.creator != self.request.user:
            raise PermissionDenied("Вы не можете удалить чужой тренажёр")
        instance.delete()

class ExerciseSessionList(generics.ListCreateAPIView):
    serializer_class = ExerciseSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return ExerciseSession.objects.filter(user=self.request.user).order_by('-started_at')
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ExerciseSessionDetail(generics.RetrieveUpdateAPIView):
    serializer_class = ExerciseSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return ExerciseSession.objects.filter(user=self.request.user)
    def perform_update(self, serializer):
        instance = self.get_object()
        old_status = instance.status
        print(f"🔍 Сессия {instance.id}: старый статус = '{old_status}', новый статус = '{serializer.validated_data.get('status', old_status)}'")
        serializer.save()
        new_status = instance.status
        if old_status != 'completed' and new_status == 'completed':
            user = self.request.user
            xp_earned = instance.correct_answers * 10
            print(f"💰 Сессия {instance.id}: правильных ответов = {instance.correct_answers}, XP для начисления = {xp_earned}")
            if xp_earned > 0:
                user.add_experience(xp_earned)
                print(f"✅ После начисления: уровень {user.level}, опыт {user.experience_points}")
            else:
                print(f"⚠️ XP не начислено: correct_answers = 0")
            check_and_grant_achievements(user)
        else:
            print(f"❌ Статус не изменился на 'completed' (old={old_status}, new={new_status})")

class UserProgressList(generics.ListCreateAPIView):
    serializer_class = UserProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return UserProgress.objects.filter(user=self.request.user)
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class UserProgressDetail(generics.RetrieveUpdateAPIView):
    serializer_class = UserProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return UserProgress.objects.filter(user=self.request.user)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_user_progress(request):
    user = request.user
    exercise_type_id = request.data.get('exercise_type')
    element_key = request.data.get('element_key')
    element_name = request.data.get('element_name')
    was_correct = request.data.get('was_correct', False)
    if not all([exercise_type_id, element_key, element_name]):
        return Response({'error': 'Missing fields'}, status=status.HTTP_400_BAD_REQUEST)
    progress, created = UserProgress.objects.get_or_create(
        user=user,
        exercise_type_id=exercise_type_id,
        element_key=element_key,
        defaults={'element_name': element_name}
    )
    progress.total_attempts += 1
    if was_correct:
        progress.correct_attempts += 1
    progress.mastery_level = progress.correct_attempts / progress.total_attempts
    progress.save()
    return Response({'status': 'ok'})

class PublicExerciseConfigList(generics.ListAPIView):
    serializer_class = ExerciseConfigSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        return ExerciseConfig.objects.filter(is_public=True).exclude(creator=user).order_by('-created_at')

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'bio', 'avatar', 'level', 'experience_points']

class UpdateProfileView(generics.UpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_object(self):
        return self.request.user

class UserAchievementsView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserAchievementSerializer
    def get_queryset(self):
        return UserAchievement.objects.filter(user=self.request.user).select_related('achievement')

User = get_user_model()

from rest_framework.parsers import MultiPartParser, FormParser

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_object(self):
        return self.request.user

class NextQuestionView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        config_id = request.query_params.get('config_id')
        session_id = request.query_params.get('session_id')
        if not config_id:
            return Response({'error': 'config_id required'}, status=400)
        try:
            config = ExerciseConfig.objects.get(id=config_id)
        except ExerciseConfig.DoesNotExist:
            return Response({'error': 'Config not found'}, status=404)
        user = request.user
        session = None
        last_element_key = None
        if session_id:
            try:
                session = ExerciseSession.objects.get(id=session_id, user=user)
                last_element_key = session.last_element_key
            except ExerciseSession.DoesNotExist:
                pass
        octave_range = get_octave_range_from_difficulty(config.difficulty.name)
        if config.settings.get('min_octave'):
            octave_range['min'] = config.settings['min_octave']
        if config.settings.get('max_octave'):
            octave_range['max'] = config.settings['max_octave']
        elements = []
        for exercise_type in config.exercise_types.all():
            type_id = exercise_type.id
            type_settings = config.type_settings.get(str(type_id), {})
            if type_id == 1:
                note_filter = type_settings.get('notes', 'all')
                allowed_notes = get_allowed_notes(note_filter)
                for note in allowed_notes:
                    for octave in range(octave_range['min'], octave_range['max'] + 1):
                        key = f"{note}{octave}"
                        elements.append({'type': 1, 'key': key, 'name': key})
            elif type_id == 2:
                allowed_intervals = type_settings.get('intervals', [i['name'] for i in INTERVALS])
                for interval_name in allowed_intervals:
                    elements.append({'type': 2, 'key': interval_name, 'name': interval_name})
            elif type_id == 3:
                allowed_chords = type_settings.get('chords', [c['name'] for c in CHORD_TYPES])
                for chord_name in allowed_chords:
                    elements.append({'type': 3, 'key': chord_name, 'name': chord_name})
        for el in elements:
            progress, _ = UserProgress.objects.get_or_create(
                user=user,
                exercise_type_id=el['type'],
                element_key=el['key'],
                defaults={'element_name': el['name']}
            )
            el['mastery'] = progress.mastery_level
            el['weight'] = (1 - el['mastery']) ** 2 + 0.01
        if last_element_key:
            filtered = [e for e in elements if e['key'] != last_element_key]
            if filtered:
                elements = filtered
        if not elements:
            return Response({'error': 'Нет элементов для генерации вопросов. Проверьте настройки тренажёра.'}, status=400)
        adaptive_mode = getattr(user, 'adaptive_mode', True)
        if not adaptive_mode:
            chosen = random.choice(elements) if elements else None
        else:
            total_weight = sum(e['weight'] for e in elements)
            r = random.uniform(0, total_weight)
            cum = 0
            chosen = None
            for el in elements:
                cum += el['weight']
                if r <= cum:
                    chosen = el
                    break
            if chosen is None and elements:
                chosen = elements[0]
        if session:
            session.last_element_key = chosen['key']
            session.save()
        type_id = chosen['type']
        type_settings = config.type_settings.get(str(type_id), {})
        answer_mode = type_settings.get('answer_mode', 'random')
        if chosen['type'] == 1:
            question = {
                'type': 'note',
                'text': '🎵 Какая нота звучит?',
                'correctNote': chosen['key'],
                'elementKey': chosen['key'],
                'elementName': chosen['name'],
                'answer_mode': answer_mode,
            }
        elif chosen['type'] == 2:
            interval_data = generate_specific_interval(chosen['key'], config.settings, config.difficulty.name, octave_range)
            question = {
                'type': 'interval',
                'text': '🎵 Какой интервал? Нажми верхнюю ноту.',
                'intervalName': chosen['key'],
                'lowerNote': interval_data['lower'],
                'upperNote': interval_data['upper'],
                'elementKey': chosen['key'],
                'elementName': chosen['name'],
                'answer_mode': answer_mode,
            }
        else:
            chord_data = generate_specific_chord(chosen['key'], config.settings, config.difficulty.name, octave_range)
            question = {
                'type': 'chord',
                'text': '🎵 Какой аккорд? Нажми тонику.',
                'chordName': chord_data['chordName'],
                'tonicNote': chord_data['tonic'],
                'chordNotes': chord_data['chordNotes'],
                'elementKey': chosen['key'],
                'elementName': chosen['name'],
                'answer_mode': answer_mode,
            }
        return Response(question)