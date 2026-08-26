from datetime import datetime

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .models import Problem, StudentProblemProgress, User
from .permissions import IsStudent
from .services.analytics import local_today
from .services.progress import (
    apply_status_action,
    build_share_draft,
    record_share_click,
    serialize_feed_item,
    student_summary,
)


def _parse_date(value):
    if not value:
        return local_today()
    try:
        return datetime.strptime(value, '%Y-%m-%d').date()
    except ValueError:
        return None


def _get_student(request):
    user = User.objects.filter(id=request.user_id).first()
    if user is None and request.user_info:
        email = request.user_info.get('email')
        if email:
            user = User.objects.filter(email__iexact=email, role='student').first()
    if user is None or not user.is_student() or user.status != 'active':
        return None
    return user


def _progress_map(student, problem_ids):
    if not problem_ids:
        return {}
    rows = StudentProblemProgress.objects.filter(student=student, problem_id__in=problem_ids)
    return {row.problem_id: row for row in rows}


@api_view(['GET'])
@permission_classes([IsStudent])
def student_feed(request):
    student = _get_student(request)
    if student is None:
        return Response({'error': 'Student profile not found.'}, status=status.HTTP_404_NOT_FOUND)

    selected_date = _parse_date(request.query_params.get('date'))
    if selected_date is None:
        return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

    today = local_today()
    if selected_date > today:
        return Response({
            'selected_date': selected_date.isoformat(),
            'timezone': 'Asia/Kolkata',
            'problems': [],
            'message': 'Future problems are not visible until their scheduled date.',
        })

    qs = (
        Problem.objects.filter(
            publication_status='published',
            scheduled_date=selected_date,
        )
        .prefetch_related('tags')
        .order_by('-scheduled_date', '-created_at', '-id')
    )

    difficulty = request.query_params.get('difficulty')
    if difficulty:
        qs = qs.filter(difficulty=difficulty)

    view = request.query_params.get('view', 'feed')
    problems = list(qs)
    progress_map = _progress_map(student, [p.id for p in problems])

    items = []
    for problem in problems:
        progress = progress_map.get(problem.id)
        status_value = progress.status if progress else 'unassigned'
        if view == 'hidden' and status_value != 'hidden':
            continue
        if view != 'hidden' and status_value == 'hidden':
            continue
        if view == 'skipped' and status_value != 'skipped':
            continue
        items.append(serialize_feed_item(problem, progress, student))

    return Response({
        'selected_date': selected_date.isoformat(),
        'timezone': 'Asia/Kolkata',
        'view': view,
        'problems': items,
        **student_summary(student, selected_date),
    })


@api_view(['GET'])
@permission_classes([IsStudent])
def student_progress(request):
    student = _get_student(request)
    if student is None:
        return Response({'error': 'Student profile not found.'}, status=status.HTTP_404_NOT_FOUND)

    selected_date = _parse_date(request.query_params.get('date'))
    if selected_date is None:
        return Response({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

    return Response(student_summary(student, selected_date))


@api_view(['GET'])
@permission_classes([IsStudent])
def student_problem_detail(request, problem_id):
    student = _get_student(request)
    if student is None:
        return Response({'error': 'Student profile not found.'}, status=status.HTTP_404_NOT_FOUND)

    try:
        problem = Problem.objects.prefetch_related('tags').get(id=problem_id)
    except Problem.DoesNotExist:
        return Response({'error': 'Problem not found.'}, status=status.HTTP_404_NOT_FOUND)

    today = local_today()
    visible = (
        problem.publication_status == 'published' and problem.scheduled_date <= today
    ) or (
        StudentProblemProgress.objects.filter(
            student=student, problem=problem, status='completed'
        ).exists()
    )
    if not visible:
        return Response({'error': 'Problem is not available.'}, status=status.HTTP_404_NOT_FOUND)

    progress = StudentProblemProgress.objects.filter(student=student, problem=problem).first()
    return Response(serialize_feed_item(problem, progress, student))


@api_view(['POST'])
@permission_classes([IsStudent])
def student_problem_status(request, problem_id):
    student = _get_student(request)
    if student is None:
        return Response({'error': 'Student profile not found.'}, status=status.HTTP_404_NOT_FOUND)

    try:
        problem = Problem.objects.prefetch_related('tags').get(id=problem_id)
    except Problem.DoesNotExist:
        return Response({'error': 'Problem not found.'}, status=status.HTTP_404_NOT_FOUND)

    today = local_today()
    if problem.publication_status != 'published' or problem.scheduled_date > today:
        return Response({'error': 'This problem is not available yet.'}, status=status.HTTP_400_BAD_REQUEST)

    action = request.data.get('action')
    try:
        progress = apply_status_action(student, problem, action)
    except ValidationError as exc:
        return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)

    payload = serialize_feed_item(problem, progress, student)
    payload['summary'] = student_summary(student, today)
    if progress.status == 'completed':
        payload['share_draft'] = build_share_draft(student, problem)
    return Response(payload)


@api_view(['POST'])
@permission_classes([IsStudent])
def student_share_click(request, problem_id):
    student = _get_student(request)
    if student is None:
        return Response({'error': 'Student profile not found.'}, status=status.HTTP_404_NOT_FOUND)

    try:
        problem = Problem.objects.prefetch_related('tags').get(id=problem_id)
    except Problem.DoesNotExist:
        return Response({'error': 'Problem not found.'}, status=status.HTTP_404_NOT_FOUND)

    try:
        progress = record_share_click(student, problem)
    except ValidationError as exc:
        return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)

    return Response(serialize_feed_item(problem, progress, student))
