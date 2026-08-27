from rest_framework import permissions
from .models import User

ADMIN_EMAILS = {
    'careerwithchaithanya@gmail.com',
    'careerwithchaitanya@gmail.com',
    'amgothvijaykumar43@gmail.com',
    'amgoth20@gmail.com',
    'admin@dsatracker.test',
}


def sync_user_from_token(request) -> User | None:
    if not request.user_id:
        return None
    user = User.objects.filter(id=request.user_id).first()
    if user:
        return user

    token_email = (request.user_info.get('email') or '').lower() if getattr(request, 'user_info', None) else ''
    if not token_email:
        return None

    user = User.objects.filter(email__iexact=token_email).first()
    if user:
        user.id = request.user_id
        if token_email in ADMIN_EMAILS:
            user.role = 'admin'
        user.save()
        return user

    role = 'admin' if token_email in ADMIN_EMAILS or 'admin' in token_email else 'student'
    name = (request.user_info.get('user_metadata', {}) or {}).get('name') or token_email.split('@')[0]
    return User.objects.create(
        id=request.user_id,
        email=token_email,
        name=name,
        role=role,
    )


class IsAuthenticated(permissions.BasePermission):
    """Check if user has valid Supabase auth token."""

    def has_permission(self, request, view):
        return request.user_id is not None


class IsAdmin(permissions.BasePermission):
    """Check if user is an admin."""

    def has_permission(self, request, view):
        user = sync_user_from_token(request)
        if not user:
            return False
        return user.is_admin() and user.status == 'active'


class IsStudent(permissions.BasePermission):
    """Check if user is a student."""

    def has_permission(self, request, view):
        user = sync_user_from_token(request)
        if not user:
            return False
        return user.is_student() and user.status == 'active'
