from django.utils.text import slugify
from rest_framework import serializers

from .models import Tag, Problem, User, StudentProblemProgress, DailyActivitySummary


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'role', 'status',
            'linkedin_url', 'github_url', 'twitter_url', 'instagram_handle',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']


class ProblemSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)

    class Meta:
        model = Problem
        fields = [
            'id', 'title', 'source_url', 'description', 'difficulty',
            'scheduled_date', 'estimated_minutes', 'publication_status',
            'tags', 'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class AdminProblemSerializer(ProblemSerializer):
    stats = serializers.SerializerMethodField()

    class Meta(ProblemSerializer.Meta):
        fields = ProblemSerializer.Meta.fields + ['stats']

    def get_stats(self, obj):
        stats_map = self.context.get('stats_map', {})
        return stats_map.get(obj.id, {
            'assigned': 0, 'started': 0, 'completed': 0,
            'skipped': 0, 'hidden': 0, 'share_clicks': 0, 'total': 0,
        })


class ProblemCreateUpdateSerializer(serializers.ModelSerializer):
    source_url = serializers.CharField(required=False, allow_blank=True, allow_null=True, default='')
    tag_names = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        allow_empty=True,
        max_length=5,
    )

    class Meta:
        model = Problem
        fields = [
            'title', 'source_url', 'description', 'difficulty',
            'scheduled_date', 'estimated_minutes', 'publication_status', 'tag_names',
        ]

    def validate_title(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError('Title must be at least 3 characters.')
        if len(value) > 120:
            raise serializers.ValidationError('Title must be at most 120 characters.')
        return value.strip()

    def validate_source_url(self, value):
        if not value or not value.strip():
            return ''
        val = value.strip()
        if not val.startswith(('http://', 'https://')):
            val = 'https://' + val
        return val

    def validate_description(self, value):
        if value and len(value) > 2000:
            raise serializers.ValidationError('Description must be at most 2000 characters.')
        return value

    def validate_estimated_minutes(self, value):
        if value is not None and (value < 5 or value > 480):
            raise serializers.ValidationError('Estimated time must be between 5 and 480 minutes.')
        return value

    def validate_tag_names(self, value):
        if len(value) > 5:
            raise serializers.ValidationError('At most 5 tags are allowed.')
        return [name.strip() for name in value if name.strip()]

    def _set_tags(self, problem, tag_names):
        problem.tags.clear()
        for name in tag_names[:5]:
            slug = slugify(name) or name.lower().replace(' ', '-')
            tag, _ = Tag.objects.get_or_create(
                name=name,
                defaults={'slug': slug},
            )
            problem.tags.add(tag)

    def create(self, validated_data):
        tag_names = validated_data.pop('tag_names', [])
        problem = Problem.objects.create(**validated_data)
        self._set_tags(problem, tag_names)
        return problem

    def update(self, instance, validated_data):
        tag_names = validated_data.pop('tag_names', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tag_names is not None:
            self._set_tags(instance, tag_names)
        return instance


class StudentProblemProgressSerializer(serializers.ModelSerializer):
    problem_title = serializers.CharField(source='problem.title', read_only=True)
    problem_difficulty = serializers.CharField(source='problem.difficulty', read_only=True)

    class Meta:
        model = StudentProblemProgress
        fields = [
            'id', 'student', 'problem', 'problem_title', 'problem_difficulty', 'status',
            'assigned_at', 'started_at', 'completed_at', 'skipped_at', 'hidden_at',
            'share_clicked_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DailyActivitySummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyActivitySummary
        fields = ['id', 'student', 'activity_date', 'completed_count', 'qualified_day', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
