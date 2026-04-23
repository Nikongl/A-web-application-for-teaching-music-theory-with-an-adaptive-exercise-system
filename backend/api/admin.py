from django.contrib import admin
from .models import User, ExerciseType, DifficultyLevel, ExerciseConfig, ExerciseSession, Question, UserProgress, Achievement, UserAchievement

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'level', 'experience_points', 'is_premium']
    list_filter = ['is_premium', 'level']
    search_fields = ['username', 'email']

@admin.register(ExerciseType)
class ExerciseTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'icon', 'order']
    list_editable = ['order']
    search_fields = ['name', 'code']

@admin.register(DifficultyLevel)
class DifficultyLevelAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'value', 'color']
    list_editable = ['value', 'color']

@admin.register(ExerciseConfig)
class ExerciseConfigAdmin(admin.ModelAdmin):
    list_display = ['name', 'creator', 'exercise_type', 'difficulty', 'is_public', 'times_used']
    list_filter = ['exercise_type', 'difficulty', 'is_public', 'created_at']
    search_fields = ['name', 'description']
    raw_id_fields = ['creator']
    filter_horizontal = ['likes']

class QuestionInline(admin.TabularInline):
    model = Question
    extra = 0
    readonly_fields = ['created_at']

@admin.register(ExerciseSession)
class ExerciseSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'config', 'status', 'started_at', 'accuracy']
    list_filter = ['status', 'started_at']
    search_fields = ['user__username', 'config__name']
    readonly_fields = ['started_at', 'completed_at']
    inlines = [QuestionInline]
    def accuracy(self, obj):
        return f"{obj.accuracy:.1f}%"
    accuracy.short_description = "Точность"

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'is_correct', 'time_spent_seconds', 'created_at']
    list_filter = ['is_correct', 'created_at']
    search_fields = ['session__user__username']

@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'element_name', 'exercise_type', 'mastery_level', 'total_attempts']
    list_filter = ['exercise_type', 'mastery_level']
    search_fields = ['user__username', 'element_name']

@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'condition_type', 'condition_value']
    search_fields = ['name', 'code']

@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    list_display = ['user', 'achievement', 'earned_at']
    list_filter = ['earned_at']
    search_fields = ['user__username', 'achievement__name']