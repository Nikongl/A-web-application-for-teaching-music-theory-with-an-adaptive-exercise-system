from rest_framework import serializers
from .models import ExerciseType, DifficultyLevel, ExerciseConfig, ExerciseSession, UserProgress

class ExerciseTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseType
        fields = ['id', 'name', 'code', 'description', 'icon', 'order']

class ExerciseConfigSerializer(serializers.ModelSerializer):
    exercise_type_name = serializers.CharField(source='exercise_type.name', read_only=True)
    creator_name = serializers.CharField(source='creator.username', read_only=True)
    
    class Meta:
        model = ExerciseConfig
        fields = [
            'id', 'name', 'description', 'exercise_type', 'exercise_type_name',
            'creator', 'creator_name', 'settings', 'questions_per_session', 
            'is_public', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class ExerciseSessionSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    config_name = serializers.CharField(source='config.name', read_only=True)
    
    class Meta:
        model = ExerciseSession
        fields = [
            'id', 'user', 'user_name', 'config', 'config_name',
            'status', 'started_at', 'completed_at', 'total_questions',
            'answered_questions', 'correct_answers'
        ]

class UserProgressSerializer(serializers.ModelSerializer):
    exercise_type_name = serializers.CharField(source='exercise_type.name', read_only=True)
    
    class Meta:
        model = UserProgress
        fields = [
            'id', 'user', 'exercise_type', 'exercise_type_name',
            'element_key', 'element_name', 'total_attempts',
            'correct_attempts', 'mastery_level'
        ]