from datetime import datetime, time, timedelta

from django.db.models import Count, Q
from django.utils import timezone

from tracker.models import StudentProblemProgress, User


def local_today():
    return timezone.localdate()


def local_day_bounds(date):
    """Return timezone-aware [start, end) datetimes for a local calendar date."""
    tz = timezone.get_current_timezone()
    start = timezone.make_aware(datetime.combine(date, time.min), tz)
    return start, start + timedelta(days=1)


def active_students():
    return User.objects.filter(role='student', status='active')


def get_qualified_dates(student_id: str) -> set:
    """Return set of dates on which the student completed at least one problem."""
    completions = (
        StudentProblemProgress.objects.filter(
            student_id=student_id,
            status='completed',
            completed_at__isnull=False,
        )
        .values_list('completed_at', flat=True)
    )
    return {timezone.localtime(dt).date() for dt in completions}


def calculate_streaks(student_id: str, reference_date=None) -> dict:
    """
    Calculate current and longest streak for a student.
    Current streak ends on reference_date if qualified, else on yesterday if qualified.
    """
    if reference_date is None:
        reference_date = local_today()

    qualified = get_qualified_dates(student_id)
    if not qualified:
        return {'current_streak': 0, 'longest_streak': 0}

    longest = 0
    streak = 0
    check_date = min(qualified)
    end_date = max(qualified)

    while check_date <= end_date:
        if check_date in qualified:
            streak += 1
            longest = max(longest, streak)
        else:
            streak = 0
        check_date += timedelta(days=1)

    current = 0
    if reference_date in qualified:
        cursor = reference_date
    elif (reference_date - timedelta(days=1)) in qualified:
        cursor = reference_date - timedelta(days=1)
    else:
        return {'current_streak': 0, 'longest_streak': longest}

    while cursor in qualified:
        current += 1
        cursor -= timedelta(days=1)

    return {'current_streak': current, 'longest_streak': longest}


def students_with_completion_on(date) -> set:
    start, end = local_day_bounds(date)
    return set(
        StudentProblemProgress.objects.filter(
            status='completed',
            completed_at__gte=start,
            completed_at__lt=end,
            student__role='student',
            student__status='active',
        ).values_list('student_id', flat=True).distinct()
    )


def students_active_on(date) -> int:
    """Distinct students who updated progress on the given date."""
    start, end = local_day_bounds(date)
    return (
        StudentProblemProgress.objects.filter(
            updated_at__gte=start,
            updated_at__lt=end,
            student__role='student',
            student__status='active',
        )
        .values('student')
        .distinct()
        .count()
    )


def completions_count_on(date) -> int:
    """Distinct students with at least one completion on the given date."""
    return len(students_with_completion_on(date))


def inactive_students_on(date):
    completed_ids = students_with_completion_on(date)
    return active_students().exclude(id__in=completed_ids).order_by('name')


def share_clicks_on(date) -> int:
    start, end = local_day_bounds(date)
    return StudentProblemProgress.objects.filter(
        share_clicked_at__gte=start,
        share_clicked_at__lt=end,
        student__role='student',
        student__status='active',
    ).count()


def problem_progress_stats(problem_id: int) -> dict:
    """Aggregate progress counts for a single problem."""
    stats = StudentProblemProgress.objects.filter(problem_id=problem_id).aggregate(
        assigned=Count('id', filter=Q(status='assigned')),
        started=Count('id', filter=Q(status='started')),
        completed=Count('id', filter=Q(status='completed')),
        skipped=Count('id', filter=Q(status='skipped')),
        hidden=Count('id', filter=Q(status='hidden')),
        share_clicks=Count('id', filter=Q(share_clicked_at__isnull=False)),
    )
    total = sum(stats.values())
    stats['total'] = total
    return stats


def problem_progress_stats_bulk(problem_ids: list) -> dict:
    """Bulk progress stats keyed by problem id."""
    if not problem_ids:
        return {}

    rows = (
        StudentProblemProgress.objects.filter(problem_id__in=problem_ids)
        .values('problem_id', 'status')
        .annotate(count=Count('id'))
    )

    result = {pid: {'assigned': 0, 'started': 0, 'completed': 0, 'skipped': 0, 'hidden': 0, 'share_clicks': 0, 'total': 0} for pid in problem_ids}

    for row in rows:
        pid = row['problem_id']
        status = row['status']
        if status in result[pid]:
            result[pid][status] = row['count']
            result[pid]['total'] += row['count']

    share_rows = (
        StudentProblemProgress.objects.filter(problem_id__in=problem_ids, share_clicked_at__isnull=False)
        .values('problem_id')
        .annotate(count=Count('id'))
    )
    for row in share_rows:
        result[row['problem_id']]['share_clicks'] = row['count']

    return result


def seven_day_trends(end_date=None) -> list:
    if end_date is None:
        end_date = local_today()

    trends = []
    for offset in range(6, -1, -1):
        day = end_date - timedelta(days=offset)
        trends.append({
            'date': day.isoformat(),
            'completions': completions_count_on(day),
            'active_students': students_active_on(day),
        })
    return trends


def student_activity_row(student: User, selected_date=None) -> dict:
    if selected_date is None:
        selected_date = local_today()

    streaks = calculate_streaks(student.id, selected_date)
    start, end = local_day_bounds(selected_date)
    today_completions = StudentProblemProgress.objects.filter(
        student=student,
        status='completed',
        completed_at__gte=start,
        completed_at__lt=end,
    ).count()

    last_completion = (
        StudentProblemProgress.objects.filter(
            student=student,
            status='completed',
            completed_at__isnull=False,
        )
        .order_by('-completed_at')
        .values_list('completed_at', flat=True)
        .first()
    )

    return {
        'id': student.id,
        'name': student.name,
        'email': student.email,
        'status': student.status,
        'today_completions': today_completions,
        'current_streak': streaks['current_streak'],
        'longest_streak': streaks['longest_streak'],
        'last_completion': last_completion.isoformat() if last_completion else None,
    }


def dashboard_summary(selected_date=None) -> dict:
    if selected_date is None:
        selected_date = local_today()

    total = active_students().count()
    completions = completions_count_on(selected_date)
    active = students_active_on(selected_date)
    rate = round((completions / total) * 100, 1) if total > 0 else 0.0

    return {
        'selected_date': selected_date.isoformat(),
        'timezone': str(timezone.get_current_timezone()),
        'total_students': total,
        'active_students': active,
        'completions': completions,
        'completion_rate': rate,
        'share_clicks': share_clicks_on(selected_date),
    }
