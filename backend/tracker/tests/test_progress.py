from datetime import date
from django.test import TestCase
from rest_framework.exceptions import ValidationError

from tracker.models import User, Problem, StudentProblemProgress
from tracker.services.progress import apply_status_action

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

    def test_problem_without_source_url(self):
        problem_no_url = Problem.objects.create(
            title='No URL Problem',
            source_url='',
            difficulty='Medium',
            scheduled_date=date.today(),
            publication_status='published',
            created_by=self.admin
        )
        self.assertEqual(problem_no_url.source_url, '')
