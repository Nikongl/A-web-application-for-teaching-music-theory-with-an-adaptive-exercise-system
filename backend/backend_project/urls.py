from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.core.management import call_command
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def load_fixtures(request):
    # Временно: загрузка фикстур по секретному ключу
    secret = request.GET.get('secret')
    if secret != 'MySuperSecretKey2026':
        return JsonResponse({'error': 'Unauthorized'}, status=403)
    try:
        call_command('loaddata', 'initial_data')
        return JsonResponse({'status': 'ok', 'message': 'Fixtures loaded successfully'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('auth/', include('dj_rest_auth.urls')),
    path('auth/registration/', include('dj_rest_auth.registration.urls')),
    # Временный эндпоинт (после загрузки фикстур удалить)
    path('load-fixtures/', load_fixtures),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)