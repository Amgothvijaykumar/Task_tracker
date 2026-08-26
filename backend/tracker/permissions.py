from rest_framework import permissions
from .models import User


class IsAuthenticated(permissions.BasePermission):
    """Check if user has valid Supabase auth token."""

    def has_permission(self, request, view):
        return request.user_id is not None


class IsAdmin(permissions.BasePermission):
    """Check if user is an admin."""

    def has_permission(self, request, view):
        if not request.user_id:
            return False
        try:
            user = User.objects.get(id=request.user_id)
            return user.is_admin() and user.status == 'active'
        except User.DoesNotExist:
            return False


class IsStudent(permissions.BasePermission):
    """Check if user is a student."""

    def has_permission(self, request, view):
        if not request.user_id:
            return False
        try:
            user = User.objects.get(id=request.user_id)
            return user.is_student() and user.status == 'active'
        except User.DoesNotExist:
            return False
