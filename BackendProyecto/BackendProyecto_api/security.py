"""
security.py - Hashing con Argon2 y manejo de sesiones con JWT
Adaptado del archivo securuty.py para Django REST Framework
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError, VerifyMismatchError
from django.conf import settings

ph = PasswordHasher()

# Configuración JWT
SECRET_KEY = getattr(settings, 'SECRET_KEY', 'jwt-fallback-secret-key-12345')
ALGORITHM = getattr(settings, 'JWT_ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = getattr(settings, 'ACCESS_TOKEN_EXPIRE_MINUTES', 60 * 24)  # 24 horas por defecto


def hasher(password: str) -> str:
    """Genera hash Argon2 de la contraseña en texto plano."""
    return ph.hash(password)


def comparar_hash(password: str, hash_str: str) -> bool:
    """Compara una contraseña en texto plano contra el hash Argon2 guardado."""
    try:
        return ph.verify(hash_str, password)
    except (VerifyMismatchError, VerificationError):
        return False
    except Exception:
        return False


def crear_token_acceso(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Crea un JWT firmado con expiración para la sesión."""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    token_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token_jwt


def decodificar_token(token: str) -> dict:
    """Decodifica y valida el token JWT."""
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def obtener_payload_desde_request(request) -> Optional[dict]:
    """
    Intenta extraer y validar el JWT desde la cookie 'access_token'
    o desde el header 'Authorization: Bearer <token>'.
    """
    token = None

    # 1. Intentar desde cookie
    cookie_token = request.COOKIES.get("access_token")
    if cookie_token:
        token = cookie_token.replace("Bearer ", "").strip()

    # 2. Si no hay cookie, intentar desde Authorization header
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        return None

    try:
        return decodificar_token(token)
    except (jwt.ExpiredSignatureError, jwt.PyJWTError):
        return None

