from django.db import models
from django.utils import timezone


class User(models.Model):
    ROLE_CHOICES = [('admin', 'Admin'), ('student', 'Student')]
    STATUS_CHOICES = [('active', 'Active'), ('deactivated', 'Deactivated')]

    id = models.CharField(max_length=255, primary_key=True)  # Supabase Auth UUID
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    linkedin_url = models.URLField(blank=True, null=True)
    github_url = models.URLField(blank=True, null=True)
    twitter_url = models.URLField(blank=True, null=True)
    instagram_handle = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.email})"

    def is_admin(self):
        return self.role == 'admin'

    def is_student(self):
        return self.role == 'student'


class Tag(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tags'
        ordering = ['name']

    def __str__(self):
        return self.name


class Problem(models.Model):
    DIFFICULTY_CHOICES = [('Easy', 'Easy'), ('Medium', 'Medium'), ('Hard', 'Hard')]
    STATUS_CHOICES = [('draft', 'Draft'), ('published', 'Published'), ('archived', 'Archived')]

    id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=120)
    source_url = models.URLField(blank=True, null=True, max_length=500)
    description = models.TextField(blank=True, null=True, max_length=2000)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    scheduled_date = models.DateField()
    estimated_minutes = models.IntegerField(blank=True, null=True)  # 5-480 minutes
    publication_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    tags = models.ManyToManyField(Tag, through='ProblemTag', blank=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='problems_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'problems'
        ordering = ['-scheduled_date', '-created_at']
        indexes = [
            models.Index(fields=['scheduled_date', 'publication_status']),
            models.Index(fields=['created_by', 'publication_status']),
        ]

    def __str__(self):
        return f"{self.title} ({self.scheduled_date})"

    def is_published(self):
        return self.publication_status == 'published'

    def is_archived(self):
        return self.publication_status == 'archived'


class ProblemTag(models.Model):
    id = models.AutoField(primary_key=True)
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'problem_tags'
        unique_together = ('problem', 'tag')
        indexes = [models.Index(fields=['problem', 'tag'])]

    def __str__(self):
        return f"{self.problem.title} - {self.tag.name}"


class StudentProblemProgress(models.Model):
    STATUS_CHOICES = [
        ('unassigned', 'Unassigned'),
        ('assigned', 'Assigned'),
        ('started', 'Started'),
        ('completed', 'Completed'),
        ('skipped', 'Skipped'),
        ('hidden', 'Hidden'),
    ]

    id = models.AutoField(primary_key=True)
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='problem_progress')
    problem = models.ForeignKey(Problem, on_delete=models.CASCADE, related_name='student_progress')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unassigned')
    assigned_at = models.DateTimeField(blank=True, null=True)
    started_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    skipped_at = models.DateTimeField(blank=True, null=True)
    hidden_at = models.DateTimeField(blank=True, null=True)
    share_clicked_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_problem_progress'
        unique_together = ('student', 'problem')
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['student', 'completed_at']),
            models.Index(fields=['problem', 'status']),
        ]
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.student.name} - {self.problem.title}: {self.status}"


class DailyActivitySummary(models.Model):
    """Materialized view for daily performance metrics (optional cache)"""

    id = models.AutoField(primary_key=True)
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='daily_summaries')
    activity_date = models.DateField()
    completed_count = models.IntegerField(default=0)
    qualified_day = models.BooleanField(default=False)  # True if >= 1 completion
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'daily_activity_summary'
        unique_together = ('student', 'activity_date')
        indexes = [
            models.Index(fields=['student', 'activity_date']),
            models.Index(fields=['activity_date']),
        ]
        ordering = ['-activity_date']

    def __str__(self):
        return f"{self.student.name} - {self.activity_date}: {self.completed_count} completed"
