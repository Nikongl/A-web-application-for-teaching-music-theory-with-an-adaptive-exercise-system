from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    ExerciseType, DifficultyLevel, ExerciseConfig,
    ExerciseSession, UserProgress, Achievement, UserAchievement
)

class ExerciseTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseType
        fields = ['id', 'name', 'code', 'icon', 'order']

class DifficultyLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = DifficultyLevel
        fields = ['id', 'name', 'code', 'value', 'color']

class ExerciseConfigSerializer(serializers.ModelSerializer):
    exercise_types = ExerciseTypeSerializer(many=True, read_only=True)
    exercise_type_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=ExerciseType.objects.all(), source='exercise_types'
    )
    difficulty_name = serializers.CharField(source='difficulty.name', read_only=True)
    creator_name = serializers.CharField(source='creator.username', read_only=True)

    class Meta:
        model = ExerciseConfig
        fields = [
            'id', 'name', 'description', 'exercise_types', 'exercise_type_ids',
            'difficulty', 'difficulty_name', 'creator', 'creator_name',
            'settings', 'type_settings', 'questions_per_session', 'time_limit_seconds',
            'is_public', 'times_used', 'likes_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'creator', 'created_at', 'updated_at', 'times_used', 'likes_count']

class ExerciseSessionSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    config_name = serializers.CharField(source='config.name', read_only=True)

    class Meta:
        model = ExerciseSession
        fields = '__all__'
        read_only_fields = ['id', 'started_at', 'user']

class UserProgressSerializer(serializers.ModelSerializer):
    exercise_type_name = serializers.CharField(source='exercise_type.name', read_only=True)
    class Meta:
        model = UserProgress
        fields = '__all__'

class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = ['id', 'name', 'description', 'icon', 'code', 'condition_type', 'condition_value']

class UserAchievementSerializer(serializers.ModelSerializer):
    achievement = AchievementSerializer(read_only=True)
    class Meta:
        model = UserAchievement
        fields = ['id', 'achievement', 'earned_at']



User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'bio', 'avatar', 'level', 'experience_points']
        read_only_fields = ['id', 'email', 'level', 'experience_points']