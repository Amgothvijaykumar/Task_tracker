from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from .models import User
from .serializers import UserSerializer
from .permissions import IsAuthenticated


@api_view(['GET'])
def health_check(request):
    return Response({'service': 'DSA Daily Tracker API', 'status': 'healthy'})


@api_view(['POST'])
def register_user(request):
    """
    Register a new user after Supabase Auth signup.
    Expects: { "id", "email", "name", "role" (optional, defaults to "student") }
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
            user = User.objects.create(
                id=user_id,
                email=email,
                name=name,
                role='student',
            )

        if not created:
            user.email = email
            user.name = name
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
    """Update current user's profile (name, linkedin_url)."""
    try:
        user = User.objects.get(id=request.user_id)
        
        if 'name' in request.data:
            user.name = request.data['name']
        if 'linkedin_url' in request.data:
            user.linkedin_url = request.data['linkedin_url']
        
        user.save()
        serializer = UserSerializer(user)
        return Response(serializer.data)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
