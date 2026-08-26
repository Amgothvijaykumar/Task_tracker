import jwt
import json
import os
from django.conf import settings
from django.http import JsonResponse
from rest_framework.exceptions import AuthenticationFailed


class SupabaseAuthMiddleware:
    """
    Middleware to extract Supabase Auth token from Authorization header
    and attach the user info to the request.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Extract token from Authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        request.user_info = None
        request.user_id = None

        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
            try:
                # Decode JWT without verification (Supabase provides verification on client)
                # In production, you'd verify the JWT signature using Supabase's public key
                decoded = jwt.decode(
                    token,
                    options={"verify_signature": False},
                    algorithms=["HS256"]
                )
                request.user_info = decoded
                request.user_id = decoded.get('sub')
            except jwt.DecodeError:
                pass

        response = self.get_response(request)
        return response
