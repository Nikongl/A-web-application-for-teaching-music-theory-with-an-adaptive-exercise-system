from django.urls import path
from . import views

urlpatterns = [
    # Exercise Types
    path('exercise-types/', views.exercise_type_list, name='exercise-type-list'),
    path('exercise-types/<int:pk>/', views.exercise_type_detail, name='exercise-type-detail'),
    
    # Exercise Configs
    path('exercise-configs/', views.exercise_config_list, name='exercise-config-list'),
    path('exercise-configs/<int:pk>/', views.exercise_config_detail, name='exercise-config-detail'),
    
    # Sessions
    path('sessions/', views.session_list, name='session-list'),
    
    # Progress
    path('progress/', views.progress_list, name='progress-list'),

    path('exercise-types-template/', views.ExerciseTypeListView.as_view(), name='exercise-types-template'),
    path('exercise-configs-template/', views.ExerciseConfigListView.as_view(), name='exercise-configs-template'),
]