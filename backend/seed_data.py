import asyncio
import os
import sys

# Add the parent directory to sys.path to allow imports from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import init_db, close_db, execute, fetch_one, fetch_val


async def seed():
    print("Initializing Database...")
    await init_db()

    try:
        # 1. Create Family
        family_name = "The Onyewuenyi Family"

        # Check if family exists
        family_id = await fetch_val(
            "SELECT id FROM family_accounts WHERE name = $1", family_name
        )

        if not family_id:
            family_id = await fetch_val(
                "INSERT INTO family_accounts (name) VALUES ($1) RETURNING id",
                family_name,
            )
            print(f"Created Family: {family_name} (ID: {family_id})")
        else:
            print(f"Family already exists: {family_name} (ID: {family_id})")

        # 2. Create Users
        users = [
            {
                "name": "Charles Onyewuenyi",
                "email": "charles@example.com",
                "google_id": "google_123_charles",
                "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Charles",
                "family_id": family_id,
            },
            {
                "name": "Maya Onyewuenyi",
                "email": "maya@example.com",
                "google_id": "google_456_maya",
                "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Maya",
                "family_id": family_id,
            },
        ]

        user_ids = []
        for u in users:
            # Check if user exists
            existing = await fetch_one(
                "SELECT id FROM users WHERE email = $1", u["email"]
            )
            if existing:
                uid = existing["id"]
                await execute(
                    "UPDATE users SET name=$1, google_id=$2, avatar=$3, family_id=$4 WHERE id=$5",
                    u["name"],
                    u["google_id"],
                    u["avatar"],
                    u["family_id"],
                    uid,
                )
                print(f"Updated User: {u['name']} (ID: {uid})")
            else:
                uid = await fetch_val(
                    """
                    INSERT INTO users (name, email, google_id, avatar, family_id)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING id
                    """,
                    u["name"],
                    u["email"],
                    u["google_id"],
                    u["avatar"],
                    u["family_id"],
                )
                print(f"Created User: {u['name']} (ID: {uid})")

            user_ids.append(uid)

        # 3. Create Tasks
        tasks = [
            {
                "title": "Fix the garage door",
                "status": "todo",
                "priority": "high",
                "task_type": "chore",
                "assignee": user_ids[0],  # Charles
            },
            {
                "title": "Buy groceries for the week",
                "status": "in-progress",
                "priority": "med",
                "task_type": "errand",
                "assignee": user_ids[1],  # Maya
            },
            {
                "title": "Schedule dentist appointment",
                "status": "todo",
                "priority": "low",
                "task_type": "appointment",
                "assignee": user_ids[0],  # Charles
            },
            {
                "title": "Clean the kitchen",
                "status": "done",
                "priority": "none",
                "task_type": "chore",
                "assignee": user_ids[1],  # Maya
            },
        ]

        # Only insert tasks if we don't have many (idempotency check roughly)
        count = await fetch_val("SELECT COUNT(*) FROM tasks")

        if count < 10:
            for t in tasks:
                await execute(
                    """
                    INSERT INTO tasks (title, status, priority, task_type, assigned_user_id)
                    VALUES ($1, $2, $3, $4, $5)
                    """,
                    t["title"],
                    t["status"],
                    t["priority"],
                    t["task_type"],
                    t["assignee"],
                )
            print(f"Created {len(tasks)} tasks.")
        else:
            print("Skipping task creation (tasks already exist)")

    except Exception as e:
        print(f"Error seeding data: {e}")
    finally:
        await close_db()


if __name__ == "__main__":
    asyncio.run(seed())
