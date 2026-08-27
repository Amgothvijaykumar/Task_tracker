from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.core.management import call_command
from django.utils import timezone
from .models import User, Tag, Problem
from .serializers import UserSerializer
from .permissions import IsAuthenticated

ADMIN_EMAILS = {
    'careerwithchaithanya@gmail.com',
    'careerwithchaitanya@gmail.com',
    'amgothvijaykumar43@gmail.com',
    'amgoth20@gmail.com',
    'admin@dsatracker.test',
}


def seed_initial_data():
    """Seed initial tags and sample published problems if database is empty."""
    try:
        if Problem.objects.count() > 0:
            return

        # Ensure admin user exists for created_by reference
        admin_user = User.objects.filter(role='admin').first()
        if not admin_user:
            admin_user = User.objects.create(
                id='admin-default-seed-id',
                email='amgothvijaykumar43@gmail.com',
                name='Amgoth Vijay Kumar',
                role='admin',
            )

        tag_array, _ = Tag.objects.get_or_create(name='Arrays', defaults={'slug': 'arrays'})
        tag_hash, _ = Tag.objects.get_or_create(name='Hash Table', defaults={'slug': 'hash-table'})
        tag_pointers, _ = Tag.objects.get_or_create(name='Two Pointers', defaults={'slug': 'two-pointers'})
        tag_binary, _ = Tag.objects.get_or_create(name='Binary Search', defaults={'slug': 'binary-search'})

        today = timezone.localdate()

        p1 = Problem.objects.create(
            title='Two Sum',
            source_url='https://leetcode.com/problems/two-sum/',
            description='Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
            difficulty='Easy',
            scheduled_date=today,
            estimated_minutes=15,
            publication_status='published',
            created_by=admin_user,
        )
        p1.tags.add(tag_array, tag_hash)

        p2 = Problem.objects.create(
            title='Valid Anagram',
            source_url='https://leetcode.com/problems/valid-anagram/',
            description='Given two strings s and t, return true if t is an anagram of s, and false otherwise.',
            difficulty='Easy',
            scheduled_date=today,
            estimated_minutes=10,
            publication_status='published',
            created_by=admin_user,
        )
        p2.tags.add(tag_hash)

        p3 = Problem.objects.create(
            title='Container With Most Water',
            source_url='https://leetcode.com/problems/container-with-most-water/',
            description='Find two lines that together with the x-axis form a container, such that the container contains the most water.',
            difficulty='Medium',
            scheduled_date=today,
            estimated_minutes=25,
            publication_status='published',
            created_by=admin_user,
        )
        p3.tags.add(tag_pointers)

    except Exception as e:
        print(f"Error seeding initial data: {e}")


@api_view(['GET'])
def health_check(request):
    db_status = 'connected'
    try:
        call_command('migrate', interactive=False)
        seed_initial_data()
        db_status = 'migrated_and_ready'
    except Exception as e:
        db_status = f'error: {str(e)}'
    return Response({'service': 'DSA Daily Tracker API', 'status': 'healthy', 'db': db_status})


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

        user = User.objects.filter(id=user_id).first()
        if user is None:
            user = User.objects.filter(email__iexact=email).first()

        created = user is None
        if created:
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
            user.id = user_id
            user.email = email
            user.name = name
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
        if user is None and getattr(request, 'user_info', None):
            token_email = request.user_info.get('email')
            if token_email:
                user = User.objects.filter(email__iexact=token_email).first()
        if user is None:
            raise User.DoesNotExist

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
