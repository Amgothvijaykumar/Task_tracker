from django.urls import path
from .views import (
    health_check,
    register_user,
    get_current_user,
    update_user_profile,
)
from .admin_api import (
    admin_analytics,
    admin_students,
    admin_problems,
    admin_problem_detail,
    admin_problem_publish,
    admin_problem_unpublish,
    admin_problem_archive,
    admin_tags,
)
from .student_api import (
    student_feed,
    student_progress,
    student_problem_detail,
    student_problem_status,
    student_share_click,
)

urlpatterns = [
    path('health/', health_check, name='health-check'),
    path('auth/register/', register_user, name='register'),
    path('auth/me/', get_current_user, name='current-user'),
    path('auth/profile/', update_user_profile, name='update-profile'),

    # Admin endpoints
    path('admin/analytics/', admin_analytics, name='admin-analytics'),
    path('admin/students/', admin_students, name='admin-students'),
    path('admin/problems/', admin_problems, name='admin-problems'),
    path('admin/problems/<int:problem_id>/', admin_problem_detail, name='admin-problem-detail'),
    path('admin/problems/<int:problem_id>/publish/', admin_problem_publish, name='admin-problem-publish'),
    path('admin/problems/<int:problem_id>/unpublish/', admin_problem_unpublish, name='admin-problem-unpublish'),
    path('admin/problems/<int:problem_id>/archive/', admin_problem_archive, name='admin-problem-archive'),
    path('admin/tags/', admin_tags, name='admin-tags'),

    # Student endpoints
    path('student/feed/', student_feed, name='student-feed'),
    path('student/progress/', student_progress, name='student-progress'),
    path('student/problems/<int:problem_id>/', student_problem_detail, name='student-problem-detail'),
    path('student/problems/<int:problem_id>/status/', student_problem_status, name='student-problem-status'),
    path('student/problems/<int:problem_id>/share/', student_share_click, name='student-share-click'),
]
