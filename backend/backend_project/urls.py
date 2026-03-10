from django.contrib import admin
from django.urls import path, include  # ВАЖНО: должен быть include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),  # ЭТА СТРОКА ДОЛЖНА БЫТЬ
]