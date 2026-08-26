from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from tracker.models import Problem, StudentProblemProgress
from tracker.services.analytics import calculate_streaks, local_day_bounds, local_today

ALLOWED_TRANSITIONS = {
    'assign': {'unassigned', 'skipped'},
    'start': {'assigned'},
    'complete': {'started', 'assigned'},
    'skip': {'unassigned', 'assigned', 'started', 'completed'},
    'hide': {'unassigned', 'assigned', 'started', 'skipped'},
    'restore': {'hidden'},
}

ACTION_STATUS = {
    'assign': 'assigned',
    'start': 'started',
    'complete': 'completed',
    'skip': 'skipped',
    'hide': 'hidden',
    'restore': 'unassigned',
}


def get_or_create_progress(student, problem):
    progress, _ = StudentProblemProgress.objects.get_or_create(
        student=student,
        problem=problem,
        defaults={'status': 'unassigned'},
    )
    return progress


def apply_status_action(student, problem, action: str) -> StudentProblemProgress:
    if action not in ACTION_STATUS:
        raise ValidationError({'action': 'Unknown action.'})

    if problem.publication_status == 'archived' and action in {'assign', 'start', 'complete'}:
        raise ValidationError({'action': 'Archived problems cannot be assigned or completed as new work.'})

    with transaction.atomic():
        progress = get_or_create_progress(student, problem)
        current = progress.status or 'unassigned'

        if current not in ALLOWED_TRANSITIONS[action]:
            if action == 'start' and current == 'unassigned':
                msg = 'Cannot start a problem before assigning it. Please assign the problem first.'
            elif action == 'complete' and current not in {'started', 'assigned'}:
                msg = f'Cannot complete a problem that is currently {current}. Please start it first.'
            else:
                msg = f'Cannot {action} a problem that is currently {current}.'
            raise ValidationError({'action': msg})

        now = timezone.now()
        new_status = ACTION_STATUS[action]

        if action == 'complete' and current == 'completed':
            return progress

        if action in {'assign', 'start'} and not progress.assigned_at:
            progress.assigned_at = now
        if action == 'start' and not progress.started_at:
            progress.started_at = now
        if action == 'complete' and not progress.completed_at:
            progress.completed_at = now
        if action == 'skip':
            progress.skipped_at = now
        if action == 'hide':
            progress.hidden_at = now

        progress.status = new_status
        progress.save()
        return progress


def record_share_click(student, problem) -> StudentProblemProgress:
    progress = get_or_create_progress(student, problem)
    if progress.status != 'completed':
        raise ValidationError({'action': 'Share is only available after completing a problem.'})
    if not progress.share_clicked_at:
        progress.share_clicked_at = timezone.now()
        progress.save(update_fields=['share_clicked_at', 'updated_at'])
    return progress


def completions_on_date(student, date) -> int:
    start, end = local_day_bounds(date)
    return StudentProblemProgress.objects.filter(
        student=student,
        status='completed',
        completed_at__gte=start,
        completed_at__lt=end,
    ).count()


def student_summary(student, selected_date=None) -> dict:
    if selected_date is None:
        selected_date = local_today()

    streaks = calculate_streaks(student.id, local_today())
    completions_today = completions_on_date(student, local_today())
    completions_selected = completions_on_date(student, selected_date)
    qualified_today = completions_today >= 1
    qualified_selected = completions_selected >= 1

    from tracker.services.analytics import get_qualified_dates
    qualified_dates = sorted(get_qualified_dates(student.id), reverse=True)

    history = []
    records = (
        StudentProblemProgress.objects.filter(student=student)
        .exclude(status='unassigned')
        .select_related('problem')
        .order_by('-updated_at')[:100]
    )
    for record in records:
        history.append({
            'id': record.id,
            'problem_id': record.problem_id,
            'problem_title': record.problem.title,
            'problem_difficulty': record.problem.difficulty,
            'scheduled_date': record.problem.scheduled_date.isoformat(),
            'status': record.status,
            'completed_at': record.completed_at.isoformat() if record.completed_at else None,
            'updated_at': record.updated_at.isoformat(),
        })

    return {
        'timezone': str(timezone.get_current_timezone()),
        'today': local_today().isoformat(),
        'selected_date': selected_date.isoformat(),
        'daily_goal': {
            'target': 1,
            'completed': min(completions_today, 1),
            'completions_today': completions_today,
            'qualified': qualified_today,
        },
        'selected_day': {
            'completions': completions_selected,
            'qualified': qualified_selected,
        },
        'current_streak': streaks['current_streak'],
        'longest_streak': streaks['longest_streak'],
        'streak_note': (
            'Current streak counts consecutive qualified days ending today, '
            'or yesterday if you have not completed a problem yet today.'
        ),
        'qualified_dates': [d.isoformat() for d in qualified_dates],
        'history': history,
    }


def build_share_draft(student, problem) -> str:
    streaks = calculate_streaks(student.id, local_today())
    tags = ', '.join(problem.tags.values_list('name', flat=True)) or 'General'
    return (
        f"✅ DSA Daily Tracker — Day {streaks['current_streak']}\n\n"
        f"Today I solved: {problem.title} ({problem.difficulty})\n"
        f"Topics: {tags}\n\n"
        f"What I learned: \n\n"
        f"#DSA #CodingInterview #Consistency"
    )


def serialize_feed_item(problem, progress, student=None) -> dict:
    status = progress.status if progress else 'unassigned'
    share_draft = None
    if status == 'completed' and student is not None:
        share_draft = build_share_draft(student, problem)

    return {
        'id': problem.id,
        'title': problem.title,
        'source_url': problem.source_url,
        'description': problem.description,
        'difficulty': problem.difficulty,
        'scheduled_date': problem.scheduled_date.isoformat(),
        'estimated_minutes': problem.estimated_minutes,
        'publication_status': problem.publication_status,
        'tags': [{'id': t.id, 'name': t.name, 'slug': t.slug} for t in problem.tags.all()],
        'my_status': status,
        'assigned_at': progress.assigned_at.isoformat() if progress and progress.assigned_at else None,
        'started_at': progress.started_at.isoformat() if progress and progress.started_at else None,
        'completed_at': progress.completed_at.isoformat() if progress and progress.completed_at else None,
        'skipped_at': progress.skipped_at.isoformat() if progress and progress.skipped_at else None,
        'hidden_at': progress.hidden_at.isoformat() if progress and progress.hidden_at else None,
        'share_clicked_at': progress.share_clicked_at.isoformat() if progress and progress.share_clicked_at else None,
        'share_draft': share_draft,
        'available_actions': available_actions(status, problem.publication_status),
    }


def available_actions(status: str, publication_status: str) -> list:
    actions = []
    for action, allowed_from in ALLOWED_TRANSITIONS.items():
        if status in allowed_from:
            if publication_status == 'archived' and action in {'assign', 'start', 'complete'}:
                continue
            actions.append(action)
    return actions
