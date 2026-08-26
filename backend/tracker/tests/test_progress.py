from datetime import date, timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from tracker.models import User, Problem, StudentProblemProgress
from tracker.services.progress import apply_status_action
from tracker.services.analytics import calculate_problem_score, calculate_student_rank_and_score

class StudentProgressTransitionsTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create(
            id='admin-1',
            email='admin@test.com',
            name='Test Admin',
            role='admin',
            status='active'
        )
        self.student = User.objects.create(
            id='student-1',
            email='student@test.com',
            name='Test Student',
            role='student',
            status='active'
        )
        self.problem = Problem.objects.create(
            title='Two Sum',
            source_url='https://leetcode.com/problems/two-sum/',
            difficulty='Easy',
            scheduled_date=date.today(),
            publication_status='published',
            created_by=self.admin
        )

    def test_start_requires_assign_first(self):
        # Trying to start an unassigned problem must raise ValidationError
        with self.assertRaises(ValidationError) as ctx:
            apply_status_action(self.student, self.problem, 'start')
        self.assertIn('Cannot start a problem before assigning it', str(ctx.exception))

    def test_full_assign_start_complete_workflow(self):
        # 1. Assign
        progress = apply_status_action(self.student, self.problem, 'assign')
        self.assertEqual(progress.status, 'assigned')
        self.assertIsNotNone(progress.assigned_at)

        # 2. Start
        progress = apply_status_action(self.student, self.problem, 'start')
        self.assertEqual(progress.status, 'started')
        self.assertIsNotNone(progress.started_at)

        # 3. Complete
        progress = apply_status_action(self.student, self.problem, 'complete')
        self.assertEqual(progress.status, 'completed')
        self.assertIsNotNone(progress.completed_at)

    def test_hide_and_restore_view_again(self):
        # 1. Hide
        progress = apply_status_action(self.student, self.problem, 'hide')
        self.assertEqual(progress.status, 'hidden')
        self.assertIsNotNone(progress.hidden_at)

        # 2. Restore (View it again)
        progress = apply_status_action(self.student, self.problem, 'restore')
        self.assertEqual(progress.status, 'unassigned')

    def test_score_calculation_tiers(self):
        today_date = date.today()
        tz = timezone.get_current_timezone()

        # Within 1 day: +10 pts
        completed_same_day = timezone.make_aware(timezone.datetime.combine(today_date, timezone.datetime.min.time()), tz)
        self.assertEqual(calculate_problem_score(today_date, completed_same_day), 10)

        # Within 2 days: +8 pts
        completed_2_days = timezone.make_aware(timezone.datetime.combine(today_date + timedelta(days=2), timezone.datetime.min.time()), tz)
        self.assertEqual(calculate_problem_score(today_date, completed_2_days), 8)

        # Within 5 days (e.g. 4 days): +5 pts
        completed_4_days = timezone.make_aware(timezone.datetime.combine(today_date + timedelta(days=4), timezone.datetime.min.time()), tz)
        self.assertEqual(calculate_problem_score(today_date, completed_4_days), 5)

        # After 5 days (e.g. 7 days): 0 pts
        completed_7_days = timezone.make_aware(timezone.datetime.combine(today_date + timedelta(days=7), timezone.datetime.min.time()), tz)
        self.assertEqual(calculate_problem_score(today_date, completed_7_days), 0)

    def test_student_rank_calculation(self):
        rank_info = calculate_student_rank_and_score(self.student.id)
        self.assertEqual(rank_info['rank'], 1)
        self.assertEqual(rank_info['total_score'], 0)
