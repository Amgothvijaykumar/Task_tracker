from datetime import datetime

from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from .models import User, Tag, Problem
from .permissions import IsAdmin
from .serializers import (
    TagSerializer,
    AdminProblemSerializer,
    ProblemCreateUpdateSerializer,
)
from .services.analytics import (
    local_today,
    dashboard_summary,
    inactive_students_on,
    seven_day_trends,
    student_activity_row,
    problem_progress_stats,
    problem_progress_stats_bulk,
)


def _parse_date(value):
    if not value:
        return local_today()
    try:
        return datetime.strptime(value, '%Y-%m-%d').date()
    except ValueError:
        return None


def _get_admin_user(request):
    return User.objects.get(id=request.user_id)


@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_analytics(request):
    selected_date = _parse_date(request.query_params.get('date'))
    if selected_date is None:
        return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

    summary = dashboard_summary(selected_date)
    inactive = inactive_students_on(selected_date)
    trends = seven_day_trends(selected_date)

    recent_problems = Problem.objects.filter(
        scheduled_date__lte=selected_date,
    ).order_by('-scheduled_date', '-created_at')[:5]

    problem_ids = list(recent_problems.values_list('id', flat=True))
    stats_map = problem_progress_stats_bulk(problem_ids)

    return Response({
        **summary,
        'inactive_students': [
            {'id': s.id, 'name': s.name, 'email': s.email}
            for s in inactive
        ],
        'recent_problems': AdminProblemSerializer(
            recent_problems, many=True, context={'stats_map': stats_map}
        ).data,
        'trends': trends,
    })


@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_students(request):
    selected_date = _parse_date(request.query_params.get('date'))
    if selected_date is None:
        return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

    search = request.query_params.get('search', '').strip()
    students = User.objects.filter(role='student', status='active')

    if search:
        students = students.filter(Q(name__icontains=search) | Q(email__icontains=search))

    student_rows = [student_activity_row(s, selected_date) for s in students]

    # Sort students by rank ascending (1, 2, 3...), then score descending, streak descending, name
    student_rows.sort(key=lambda x: (x.get('rank', 9999), -x.get('total_score', 0), -x.get('current_streak', 0), x.get('name', '')))

    return Response({
        'selected_date': selected_date.isoformat(),
        'students': student_rows,
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAdmin])
def admin_problems(request):
    if request.method == 'GET':
        qs = Problem.objects.all().prefetch_related('tags', 'created_by')

        scheduled_date = request.query_params.get('scheduled_date')
        if scheduled_date:
            parsed = _parse_date(scheduled_date)
            if parsed is None:
                return Response({'error': 'Invalid scheduled_date.'}, status=status.HTTP_400_BAD_REQUEST)
            qs = qs.filter(scheduled_date=parsed)

        publication_status = request.query_params.get('status')
        if publication_status:
            qs = qs.filter(publication_status=publication_status)

        difficulty = request.query_params.get('difficulty')
        if difficulty:
            qs = qs.filter(difficulty=difficulty)

        tag = request.query_params.get('tag')
        if tag:
            qs = qs.filter(tags__name__iexact=tag)

        qs = qs.distinct().order_by('-scheduled_date', '-created_at')
        problem_ids = list(qs.values_list('id', flat=True))
        stats_map = problem_progress_stats_bulk(problem_ids)

        return Response(
            AdminProblemSerializer(qs, many=True, context={'stats_map': stats_map}).data
        )

    admin_user = _get_admin_user(request)
    serializer = ProblemCreateUpdateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    problem = serializer.save(created_by=admin_user)
    stats = problem_progress_stats(problem.id)
    return Response(
        AdminProblemSerializer(problem, context={'stats_map': {problem.id: stats}}).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET', 'PATCH'])
@permission_classes([IsAdmin])
def admin_problem_detail(request, problem_id):
    try:
        problem = Problem.objects.prefetch_related('tags', 'created_by').get(id=problem_id)
    except Problem.DoesNotExist:
        return Response({'error': 'Problem not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        stats = problem_progress_stats(problem.id)
        return Response(
            AdminProblemSerializer(problem, context={'stats_map': {problem.id: stats}}).data
        )

    serializer = ProblemCreateUpdateSerializer(problem, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    problem = serializer.save()
    stats = problem_progress_stats(problem.id)
    return Response(
        AdminProblemSerializer(problem, context={'stats_map': {problem.id: stats}}).data
    )


@api_view(['POST'])
@permission_classes([IsAdmin])
def admin_problem_publish(request, problem_id):
    try:
        problem = Problem.objects.get(id=problem_id)
    except Problem.DoesNotExist:
        return Response({'error': 'Problem not found.'}, status=status.HTTP_404_NOT_FOUND)

    problem.publication_status = 'published'
    problem.save(update_fields=['publication_status', 'updated_at'])
    stats = problem_progress_stats(problem.id)
    return Response(
        AdminProblemSerializer(problem, context={'stats_map': {problem.id: stats}}).data
    )


@api_view(['POST'])
@permission_classes([IsAdmin])
def admin_problem_unpublish(request, problem_id):
    try:
        problem = Problem.objects.get(id=problem_id)
    except Problem.DoesNotExist:
        return Response({'error': 'Problem not found.'}, status=status.HTTP_404_NOT_FOUND)

    problem.publication_status = 'draft'
    problem.save(update_fields=['publication_status', 'updated_at'])
    stats = problem_progress_stats(problem.id)
    return Response(
        AdminProblemSerializer(problem, context={'stats_map': {problem.id: stats}}).data
    )


@api_view(['POST'])
@permission_classes([IsAdmin])
def admin_problem_archive(request, problem_id):
    try:
        problem = Problem.objects.get(id=problem_id)
    except Problem.DoesNotExist:
        return Response({'error': 'Problem not found.'}, status=status.HTTP_404_NOT_FOUND)

    problem.publication_status = 'archived'
    problem.save(update_fields=['publication_status', 'updated_at'])
    stats = problem_progress_stats(problem.id)
    return Response(
        AdminProblemSerializer(problem, context={'stats_map': {problem.id: stats}}).data
    )


@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_tags(request):
    tags = Tag.objects.all().order_by('name')
    return Response(TagSerializer(tags, many=True).data)
