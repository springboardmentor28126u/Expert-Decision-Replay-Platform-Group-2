"""
One-time script to find and clean up broken user rows in the database.

Checks for:
- Users with NULL role_id
- Users with NULL/empty password_hash
- Users missing a user_profile row
- Users with invalid status

Run from the backend directory:
    python cleanup_broken_users.py
"""

import sys
import os

# Add the backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from app.database.session import SessionLocal
from app.models.user import User, UserStatus
from app.models.user_profile import UserProfile


def find_broken_users():
    db = SessionLocal()
    try:
        print("=" * 60)
        print("  DATABASE HEALTH CHECK — Users Table")
        print("=" * 60)

        all_users = db.query(User).all()
        print(f"\nTotal users in database: {len(all_users)}\n")

        broken_users = []

        for user in all_users:
            issues = []

            if user.role_id is None:
                issues.append("NULL role_id")
            if not user.password_hash:
                issues.append("NULL/empty password_hash")
            if user.status is None:
                issues.append("NULL status")

            # Check for missing profile
            profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
            if not profile:
                issues.append("missing user_profile row")

            # Check role relationship
            if user.role is None and user.role_id is not None:
                issues.append(f"role_id={user.role_id} does not exist in roles table")

            if issues:
                broken_users.append((user, issues))

            status_mark = "✓" if not issues else "✗"
            print(f"  {status_mark} {user.email} (id={user.id})")
            print(f"    name={user.full_name}, status={user.status}, role_id={user.role_id}")
            if issues:
                print(f"    ISSUES: {', '.join(issues)}")
            print()

        print("-" * 60)
        if broken_users:
            print(f"\n⚠ Found {len(broken_users)} user(s) with issues:\n")
            for user, issues in broken_users:
                print(f"  - {user.email} ({user.id}): {', '.join(issues)}")

            print("\nTo delete these users, re-run with --delete flag:")
            print("  python cleanup_broken_users.py --delete")
        else:
            print("\n✓ All users look healthy. No cleanup needed.")

        return broken_users

    finally:
        db.close()


def delete_broken_users():
    db = SessionLocal()
    try:
        broken_users = []
        all_users = db.query(User).all()

        for user in all_users:
            issues = []
            if user.role_id is None:
                issues.append("NULL role_id")
            if not user.password_hash:
                issues.append("NULL/empty password_hash")
            if user.role is None and user.role_id is not None:
                issues.append("orphaned role_id")
            profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
            if not profile:
                issues.append("missing profile")
            if issues:
                broken_users.append((user, issues))

        if not broken_users:
            print("No broken users found. Nothing to delete.")
            return

        print(f"\nDeleting {len(broken_users)} broken user(s):")
        for user, issues in broken_users:
            print(f"  Deleting {user.email} ({user.id}) — {', '.join(issues)}")
            # Delete profile first (if exists)
            db.query(UserProfile).filter(UserProfile.user_id == user.id).delete()
            db.delete(user)

        db.commit()
        print(f"\n✓ Deleted {len(broken_users)} broken user(s).")

    except Exception as e:
        db.rollback()
        print(f"\n✗ Error during cleanup: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    if "--delete" in sys.argv:
        print("Running in DELETE mode...\n")
        delete_broken_users()
    else:
        find_broken_users()
