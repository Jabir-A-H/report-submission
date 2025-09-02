#!/usr/bin/env python3
"""
Generate a secure SECRET_KEY for Flask production deployment
"""

import secrets
import string


def generate_secret_key(length: int = 32) -> str:
    """Generate a cryptographically secure secret key"""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return "".join(secrets.choice(alphabet) for _ in range(length))


if __name__ == "__main__":
    secret_key = generate_secret_key()
    print("🔐 Generated SECRET_KEY for production:")
    print(f"SECRET_KEY={secret_key}")
    print()
    print("📋 Copy this to your Render environment variables!")
