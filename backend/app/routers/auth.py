from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import logging

from app.database import get_connection
from app.models.user import UserResponse
from app.models.family import FamilyResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


class GoogleProfile(BaseModel):
    google_id: str
    email: EmailStr
    name: str
    image: str | None = None


class AuthResponse(BaseModel):
    user: UserResponse
    family: FamilyResponse
    is_new_user: bool


@router.post("/sync", response_model=AuthResponse)
async def sync_google_user(profile: GoogleProfile):
    """
    Syncs a user from Google OAuth.
    If user exists, returns user and family.
    If not, creates new FamilyAccount and User.

    Session Authority:
    - Backend trusts Google identity verified by NextAuth (sub, email).
    - We NEVER trust client-sent user IDs for lookup.
    """

    # Invariant: Every authenticated Google user must map to exactly one User and one FamilyAccount.
    # Partial states are not allowed.

    async with get_connection() as conn:
        async with conn.transaction():
            # 1. Check if user exists by google_id (UNIQUE constraint protected)
            existing_user_query = """
                SELECT id, name, email, avatar, google_id, family_id, created_at, updated_at
                FROM users 
                WHERE google_id = $1
            """
            user_record = await conn.fetchrow(existing_user_query, profile.google_id)

            # 2. If user exists, fetch family and return
            if user_record:
                family_record = await conn.fetchrow(
                    "SELECT * FROM family_accounts WHERE id = $1",
                    user_record["family_id"],
                )
                if not family_record:
                    # Critical data integrity issue
                    logger.error(
                        f"Integrity Error: User {user_record['id']} has no associated family."
                    )
                    raise HTTPException(
                        status_code=500, detail="User has no associated family"
                    )

                return AuthResponse(
                    user=UserResponse(**dict(user_record)),
                    family=FamilyResponse(**dict(family_record)),
                    is_new_user=False,
                )

            # 3. If user does not exist, check for email collision (Account linking)
            email_check_query = """
                SELECT id, family_id FROM users WHERE email = $1
            """
            user_with_email = await conn.fetchrow(email_check_query, profile.email)

            if user_with_email:
                # Link existing user to Google ID
                existing_id = user_with_email["id"]
                family_id = user_with_email["family_id"]

                # If existing user has no family (legacy/migration case), create one
                if not family_id:
                    family_name = (
                        f"The {profile.name.split()[-1]} Family"
                        if " " in profile.name
                        else f"{profile.name}'s Family"
                    )
                    family_id = await conn.fetchval(
                        "INSERT INTO family_accounts (name) VALUES ($1) RETURNING id",
                        family_name,
                    )
                    logger.info(
                        f"family.created {{ family_id: {family_id}, user_id: {existing_id}, email: '{profile.email}', reason: 'legacy_migration' }}"
                    )

                # Update user
                updated_user = await conn.fetchrow(
                    """
                    UPDATE users 
                    SET google_id = $1, family_id = $2, avatar = COALESCE(avatar, $3)
                    WHERE id = $4
                    RETURNING id, name, email, avatar, google_id, family_id, created_at, updated_at
                    """,
                    profile.google_id,
                    family_id,
                    profile.image,
                    existing_id,
                )

                family_record = await conn.fetchrow(
                    "SELECT * FROM family_accounts WHERE id = $1", family_id
                )

                logger.info(
                    f"user.linked {{ user_id: {existing_id}, google_id: '{profile.google_id}' }}"
                )

                return AuthResponse(
                    user=UserResponse(**dict(updated_user)),
                    family=FamilyResponse(**dict(family_record)),
                    is_new_user=False,
                )

            # 4. Create new Family and User (Atomic Transaction)
            # Create Family
            family_name = (
                f"The {profile.name.split()[-1]} Family"
                if " " in profile.name
                else f"{profile.name}'s Family"
            )
            family_id = await conn.fetchval(
                "INSERT INTO family_accounts (name) VALUES ($1) RETURNING id",
                family_name,
            )

            # Create User (ParentUser)
            # NOTE: Family membership is immutable in MVP. No leave/remove flows are supported.
            new_user = await conn.fetchrow(
                """
                INSERT INTO users (name, email, google_id, avatar, family_id)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, name, email, avatar, google_id, family_id, created_at, updated_at
                """,
                profile.name,
                profile.email,
                profile.google_id,
                profile.image,
                family_id,
            )

            family_record = await conn.fetchrow(
                "SELECT * FROM family_accounts WHERE id = $1", family_id
            )

            logger.info(
                f"family.created {{ family_id: {family_id}, user_id: {new_user['id']}, email: '{profile.email}' }}"
            )
            logger.info(
                f"user.created {{ user_id: {new_user['id']}, google_id: '{profile.google_id}' }}"
            )

            return AuthResponse(
                user=UserResponse(**dict(new_user)),
                family=FamilyResponse(**dict(family_record)),
                is_new_user=True,
            )
