from django.urls import path
from . import views

urlpatterns = [
    # Exercise Types
    path('exercise-types/', views.ExerciseTypeList.as_view(), name='exercise-type-list'),
    path('exercise-types/<int:pk>/', views.ExerciseTypeDetail.as_view(), name='exercise-type-detail'),

    # Difficulty Levels
    path('difficulties/', views.DifficultyLevelList.as_view(), name='difficulty-list'),

    # Exercise Configs (конструктор)
    path('configs/', views.ExerciseConfigList.as_view(), name='config-list'),
    path('configs/<int:pk>/', views.ExerciseConfigDetail.as_view(), name='config-detail'),

    # Sessions
    path('sessions/', views.ExerciseSessionList.as_view(), name='session-list'),
    path('sessions/<int:pk>/', views.ExerciseSessionDetail.as_view(), name='session-detail'),

    # Progress
    path('progress/', views.UserProgressList.as_view(), name='progress-list'),
    path('progress/<int:pk>/', views.UserProgressDetail.as_view(), name='progress-detail'),

    path('user-statistics/', views.UserStatisticsView.as_view(), name='user-statistics'),


    path('user-detailed-statistics/', views.UserDetailedStatisticsView.as_view(), name='user-detailed-statistics'),
    
    path('user-progress/update/', views.update_user_progress, name='update-user-progress'),
]
