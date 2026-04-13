from rest_framework import serializers
from .models import ExerciseType, DifficultyLevel, ExerciseConfig, ExerciseSession, UserProgress

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
        read_only_fields = ['id', 'started_at', 'user', 'completed_at', 'answered_questions', 'correct_answers']

class UserProgressSerializer(serializers.ModelSerializer):
    exercise_type_name = serializers.CharField(source='exercise_type.name', read_only=True)
    class Meta:
        model = UserProgress
        fields = '__all__'