from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import ExerciseType, ExerciseConfig, ExerciseSession, UserProgress
from .serializers import (
    ExerciseTypeSerializer, ExerciseConfigSerializer,
    ExerciseSessionSerializer, UserProgressSerializer
)

@api_view(['GET', 'POST'])
def exercise_type_list(request):
    """GET: список типов, POST: создать тип"""
    if request.method == 'GET':
        types = ExerciseType.objects.all().order_by('order')
        serializer = ExerciseTypeSerializer(types, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ExerciseTypeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
def exercise_type_detail(request, pk):
    """GET, PUT, DELETE для конкретного типа"""
    exercise_type = get_object_or_404(ExerciseType, pk=pk)
    
    if request.method == 'GET':
        serializer = ExerciseTypeSerializer(exercise_type)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = ExerciseTypeSerializer(exercise_type, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        exercise_type.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET', 'POST'])
def exercise_config_list(request):
    """GET: список конфигураций, POST: создать конфигурацию"""
    if request.method == 'GET':
        configs = ExerciseConfig.objects.all().order_by('-created_at')
        serializer = ExerciseConfigSerializer(configs, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ExerciseConfigSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
def exercise_config_detail(request, pk):
    """GET, PUT, DELETE для конкретной конфигурации"""
    config = get_object_or_404(ExerciseConfig, pk=pk)
    
    if request.method == 'GET':
        serializer = ExerciseConfigSerializer(config)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = ExerciseConfigSerializer(config, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        config.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET', 'POST'])
def session_list(request):
    if request.method == 'GET':
        sessions = ExerciseSession.objects.all().order_by('-started_at')
        serializer = ExerciseSessionSerializer(sessions, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = ExerciseSessionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
def progress_list(request):
    if request.method == 'GET':
        progress = UserProgress.objects.all()
        serializer = UserProgressSerializer(progress, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = UserProgressSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)