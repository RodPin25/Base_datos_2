"""
URL configuration for BackendProyecto project.
"""
from django.urls import path, include
from django.views.generic import RedirectView
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    path('', RedirectView.as_view(pattern_name='swagger-ui', permanent=False)),
    path('docs/', RedirectView.as_view(pattern_name='swagger-ui', permanent=False)),
    path('swagger/', RedirectView.as_view(pattern_name='swagger-ui', permanent=False)),

    path('api/', include('BackendProyecto_api.urls')),

    # OpenAPI 3 Schema & Swagger UI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

