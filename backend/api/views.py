from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta
from .models import ExerciseSession, UserProgress, User

from rest_framework import generics, permissions
from django.db import models
from .models import ExerciseType, DifficultyLevel, ExerciseConfig, ExerciseSession, UserProgress
from .serializers import (
    ExerciseTypeSerializer, DifficultyLevelSerializer,
    ExerciseConfigSerializer, ExerciseSessionSerializer, UserProgressSerializer
)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import F, Q, Sum, Count, FloatField, Value
from django.db.models.functions import Coalesce
from .models import UserProgress, ExerciseSession, User
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status

class UserDetailedStatisticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # Общая статистика из сессий
        sessions = ExerciseSession.objects.filter(user=user, status='completed')
        total_sessions = sessions.count()
        total_answered = sessions.aggregate(total=Sum('answered_questions'))['total'] or 0
        total_correct = sessions.aggregate(total=Sum('correct_answers'))['total'] or 0
        overall_accuracy = round((total_correct / total_answered * 100) if total_answered > 0 else 0)

        # Прогресс по элементам
        progress_notes = UserProgress.objects.filter(user=user, exercise_type=1).annotate(
            accuracy=Coalesce(F('correct_attempts') * 100.0 / F('total_attempts'), Value(0.0), output_field=FloatField())
        ).order_by('accuracy')[:5]
        progress_intervals = UserProgress.objects.filter(user=user, exercise_type=2).annotate(
            accuracy=Coalesce(F('correct_attempts') * 100.0 / F('total_attempts'), Value(0.0), output_field=FloatField())
        ).order_by('accuracy')[:5]
        progress_chords = UserProgress.objects.filter(user=user, exercise_type=3).annotate(
            accuracy=Coalesce(F('correct_attempts') * 100.0 / F('total_attempts'), Value(0.0), output_field=FloatField())
        ).order_by('accuracy')[:5]

        def serialize(progress_list):
            return [{'name': p.element_name, 'accuracy': round(p.accuracy, 1), 'attempts': p.total_attempts} for p in progress_list]

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
        # Все сессии пользователя (завершённые)
        sessions = ExerciseSession.objects.filter(user=user, status='completed')
        total_sessions = sessions.count()
        total_questions = sum(s.answered_questions for s in sessions)
        correct_questions = sum(s.correct_answers for s in sessions)
        overall_accuracy = round((correct_questions / total_questions * 100) if total_questions > 0 else 0)

        # Данные по дням (последние 7 дней)
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

        # Распределение по типам упражнений (через UserProgress или через config)
        # Упрощённо: считаем количество вопросов по exercise_type
        # (нужно будет добавить поле exercise_type в Question или использовать UserProgress)
        # Пока сделаем заглушку: вернём пустые данные. Реализуйте позже.
        type_labels = ['Ноты', 'Интервалы', 'Аккорды']
        type_counts = [0, 0, 0]
        # Здесь можно запросить статистику из UserProgress или из сессий через config.exercise_type

        # Слабые темы – из UserProgress, где mastery_level < 0.6
        weak_progress = UserProgress.objects.filter(user=user, mastery_level__lt=0.6).order_by('mastery_level')[:5]
        weak_topics = [
            {
                'name': p.element_name,
                'accuracy': round(p.success_rate),
                'attempts': p.total_attempts,
            } for p in weak_progress
        ]

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
            'weak_topics': weak_topics,
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