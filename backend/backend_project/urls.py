from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),          # ваши существующие API
    path('auth/', include('dj_rest_auth.urls')),          # логин, логаут, refresh
    path('auth/registration/', include('dj_rest_auth.registration.urls')),  # регистрация
]