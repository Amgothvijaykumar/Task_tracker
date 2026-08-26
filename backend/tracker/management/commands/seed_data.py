from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from tracker.models import User, Tag, Problem, StudentProblemProgress
import uuid


class Command(BaseCommand):
    help = 'Seed the database with initial test data'

    def handle(self, *args, **options):
        self.stdout.write('Starting seed data creation...')

        # Create tags
        tags_data = ['Array', 'Hash Map', 'DP', 'String', 'Tree', 'Graph', 'Greedy']
        tags = {}
        for tag_name in tags_data:
            tag, created = Tag.objects.get_or_create(
                name=tag_name,
                defaults={'slug': tag_name.lower().replace(' ', '-')}
            )
            tags[tag_name] = tag
            status = 'created' if created else 'exists'
            self.stdout.write(self.style.SUCCESS(f'Tag {tag_name}: {status}'))

        # Create admin user
        admin_id = str(uuid.uuid4())
        admin, admin_created = User.objects.get_or_create(
            id=admin_id,
            defaults={
                'email': 'admin@dsatracker.test',
                'name': 'Vijay Kumar',
                'role': 'admin',
                'status': 'active',
            }
        )
        self.stdout.write(self.style.SUCCESS(f'Admin user: {"created" if admin_created else "exists"}'))

        # Create student users
        students = []
        student_emails = [
            'ravi@dsatracker.test',
            'priya@dsatracker.test',
            'arjun@dsatracker.test',
            'neha@dsatracker.test',
            'dev@dsatracker.test',
        ]
        student_names = ['Ravi', 'Priya', 'Arjun', 'Neha', 'Dev']

        for email, name in zip(student_emails, student_names):
            student_id = str(uuid.uuid4())
            student, created = User.objects.get_or_create(
                id=student_id,
                defaults={
                    'email': email,
                    'name': name,
                    'role': 'student',
                    'status': 'active',
                }
            )
            students.append(student)
            status = 'created' if created else 'exists'
            self.stdout.write(self.style.SUCCESS(f'Student {name}: {status}'))

        # Create problems for the past 7 days
        problems_data = [
            {'title': 'Two Sum', 'difficulty': 'Easy', 'days_ago': 6},
            {'title': 'Add Two Numbers', 'difficulty': 'Medium', 'days_ago': 5},
            {'title': 'Longest Substring Without Repeating Characters', 'difficulty': 'Medium', 'days_ago': 4},
            {'title': 'Median of Two Sorted Arrays', 'difficulty': 'Hard', 'days_ago': 3},
            {'title': 'Longest Palindromic Substring', 'difficulty': 'Medium', 'days_ago': 2},
            {'title': 'ZigZag Conversion', 'difficulty': 'Medium', 'days_ago': 1},
            {'title': 'Reverse Integer', 'difficulty': 'Easy', 'days_ago': 0},
        ]

        problems = []
        for idx, prob_data in enumerate(problems_data):
            scheduled_date = timezone.now().date() - timedelta(days=prob_data['days_ago'])
            problem, created = Problem.objects.get_or_create(
                title=prob_data['title'],
                scheduled_date=scheduled_date,
                defaults={
                    'source_url': f'https://leetcode.com/problems/{prob_data["title"].lower().replace(" ", "-")}/',
                    'description': f'Sample problem description for {prob_data["title"]}',
                    'difficulty': prob_data['difficulty'],
                    'estimated_minutes': 30,
                    'publication_status': 'published',
                    'created_by': admin,
                }
            )
            problems.append(problem)

            # Add random tags
            if idx % 2 == 0:
                problem.tags.add(tags['Array'])
            if idx % 3 == 0:
                problem.tags.add(tags['Hash Map'])
            if idx % 5 == 0:
                problem.tags.add(tags['DP'])

            status = 'created' if created else 'exists'
            self.stdout.write(self.style.SUCCESS(f'Problem {problem.title}: {status}'))

        # Create student progress records
        for problem in problems:
            for student in students:
                progress, created = StudentProblemProgress.objects.get_or_create(
                    student=student,
                    problem=problem,
                    defaults={
                        'status': 'unassigned',
                    }
                )

                if created:
                    # Randomly assign some problems
                    import random
                    rand = random.random()

                    if rand < 0.7:  # 70% assigned
                        progress.status = 'assigned'
                        progress.assigned_at = timezone.now() - timedelta(hours=random.randint(1, 24))
                        progress.save()

                    if rand < 0.5:  # 50% started
                        progress.status = 'started'
                        progress.started_at = progress.assigned_at + timedelta(minutes=5)
                        progress.save()

                    if rand < 0.3:  # 30% completed
                        progress.status = 'completed'
                        progress.completed_at = progress.started_at + timedelta(minutes=random.randint(15, 60))
                        progress.share_clicked_at = progress.completed_at + timedelta(minutes=random.randint(1, 10))
                        progress.save()

                    if 0.3 <= rand < 0.4:  # 10% skipped
                        progress.status = 'skipped'
                        progress.skipped_at = progress.assigned_at + timedelta(minutes=random.randint(1, 30))
                        progress.save()

        self.stdout.write(self.style.SUCCESS('✓ Seed data created successfully!'))
        self.stdout.write(f'\nSummary:')
        self.stdout.write(f'  - Admin: 1')
        self.stdout.write(f'  - Students: {len(students)}')
        self.stdout.write(f'  - Problems: {len(problems)}')
        self.stdout.write(f'  - Tags: {len(tags)}')
