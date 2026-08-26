from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .models import User
from .serializers import UserSerializer
from .permissions import IsAuthenticated

ADMIN_EMAILS = {
    'amgothvijaykumar43@gmail.com',
    'careerwithchaitanya@gmail.com',
    'amgoth20@gmail.com',
    'admin@dsatracker.test',
}


@api_view(['GET'])
def health_check(request):
    return Response({'service': 'DSA Daily Tracker API', 'status': 'healthy'})


@api_view(['POST'])
def register_user(request):
    """
    Register a new user after Supabase Auth signup / Google OAuth.
    Expects: { "id", "email", "name", "role" (optional) }
    Automatically grants Admin role to designated admin emails.
    """
    try:
        user_id = request.data.get('id')
        email = request.data.get('email')
        name = request.data.get('name') or (email.split('@')[0] if email else 'User')

        if not user_id or not email:
            return Response(
                {'error': 'id and email are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Match by UID first, then email so existing profiles survive an OAuth UID change.
        user = User.objects.filter(id=user_id).first()
        if user is None:
            user = User.objects.filter(email__iexact=email).first()

        created = user is None
        if created:
            # Grant admin role if requested or email matches admin email list
            requested_role = request.data.get('role')
            if requested_role and requested_role in ('admin', 'student'):
                role = requested_role
            elif email.lower() in ADMIN_EMAILS or 'admin' in email.lower():
                role = 'admin'
            else:
                role = 'student'

            user = User.objects.create(
                id=user_id,
                email=email,
                name=name,
                role=role,
            )

        if not created:
            user.id = user_id  # Sync Supabase UID if needed
            user.email = email
            user.name = name
            # Check if email is in admin list
            if email.lower() in ADMIN_EMAILS:
                user.role = 'admin'
            user.save()

        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """Get the current authenticated user's profile."""
    try:
        user = User.objects.filter(id=request.user_id).first()
        if user is None and request.user_info:
            token_email = request.user_info.get('email')
            if token_email:
                user = User.objects.filter(email__iexact=token_email).first()
        if user is None:
            raise User.DoesNotExist

        # Ensure admin emails always have admin role
        if user.email and user.email.lower() in ADMIN_EMAILS and user.role != 'admin':
            user.role = 'admin'
            user.save(update_fields=['role'])

        serializer = UserSerializer(user)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    """Update current user's profile (name, linkedin_url, github_url, twitter_url, instagram_handle)."""
    try:
        user = User.objects.get(id=request.user_id)
        
        if 'name' in request.data:
            user.name = request.data['name']
        if 'linkedin_url' in request.data:
            user.linkedin_url = request.data['linkedin_url']
        if 'github_url' in request.data:
            user.github_url = request.data['github_url']
        if 'twitter_url' in request.data:
            user.twitter_url = request.data['twitter_url']
        if 'instagram_handle' in request.data:
            user.instagram_handle = request.data['instagram_handle']
        
        user.save()
        serializer = UserSerializer(user)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
