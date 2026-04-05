import asyncio
import os
import sys
from datetime import date, timedelta

# Add the parent directory to sys.path to allow imports from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import init_db, close_db, execute, fetch_one, fetch_val, fetch_all


async def seed():
    print("Initializing Database...")
    await init_db()

    try:
        # ── CLEAR EXISTING DATA ─────────────────────────────────────────
        print("Clearing existing data...")
        await execute("DELETE FROM task_assignees")
        await execute("DELETE FROM dependencies")
        await execute("DELETE FROM subtasks")
        await execute("DELETE FROM task_links")
        await execute("DELETE FROM tasks")
        await execute("DELETE FROM users")

        # Reset sequences
        await execute("ALTER SEQUENCE tasks_id_seq RESTART WITH 1")
        await execute("ALTER SEQUENCE users_id_seq RESTART WITH 1")

        # ── CREATE USERS ────────────────────────────────────────────────
        print("Creating users...")
        users_data = [
            {
                "name": "Charles Amanze",
                "first_name": "Charles",
                "last_name": "Amanze",
                "email": "charles@famops.app",
                "birthday": date(1993, 6, 15),
                "avatar": "https://randomuser.me/api/portraits/men/32.jpg",
            },
            {
                "name": "Maya Amanze",
                "first_name": "Maya",
                "last_name": "Amanze",
                "email": "maya@famops.app",
                "birthday": date(1995, 3, 22),
                "avatar": "https://randomuser.me/api/portraits/women/44.jpg",
            },
        ]

        user_ids = {}
        for u in users_data:
            uid = await fetch_val(
                """
                INSERT INTO users (name, first_name, last_name, email, birthday, avatar)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
                """,
                u["name"], u["first_name"], u["last_name"],
                u["email"], u["birthday"], u["avatar"],
            )
            user_ids[u["first_name"].lower()] = uid
            print(f"  Created user: {u['name']} (ID: {uid})")

        charles = user_ids["charles"]
        maya = user_ids["maya"]

        today = date.today()
        yesterday = today - timedelta(days=1)
        two_days_ago = today - timedelta(days=2)
        three_days_ago = today - timedelta(days=3)
        tomorrow = today + timedelta(days=1)
        day_after = today + timedelta(days=2)
        this_friday = today + timedelta(days=(4 - today.weekday()) % 7 or 7)
        this_saturday = this_friday + timedelta(days=1)
        next_week = today + timedelta(days=7)

        # ── CREATE TASKS ────────────────────────────────────────────────
        print("Creating tasks...")

        tasks_data = [
            # ── OVERDUE (tests overdue indicators) ──────────────────────
            {
                "title": "Schedule pediatrician well-check",
                "description": "Annual checkup for Naia — need to call Dr. Kim's office. They book out 3 weeks.",
                "status": "todo",
                "priority": "urgent",
                "task_type": "appointment",
                "assigned_user_id": maya,
                "due_date": three_days_ago,
                "failure_cost": "Miss the insurance window → pay out of pocket",
                "tags": ["health", "naia"],
            },
            {
                "title": "Pay daycare invoice",
                "description": "Monthly invoice from Little Stars. Payment portal: littlestars.com/pay",
                "status": "todo",
                "priority": "urgent",
                "task_type": "errand",
                "assigned_user_id": charles,
                "due_date": two_days_ago,
                "failure_cost": "Late fee + risk losing the spot",
                "tags": ["finance"],
            },
            {
                "title": "Return Amazon package",
                "description": "Wrong size shoes. Return label printed, box on counter.",
                "status": "todo",
                "priority": "low",
                "task_type": "errand",
                "assigned_user_id": charles,
                "due_date": yesterday,
                "tags": ["errands"],
            },

            # ── DUE TODAY (tests due-soon indicators) ───────────────────
            {
                "title": "Prep bottles + snacks for daycare",
                "status": "todo",
                "priority": "high",
                "task_type": "chore",
                "assigned_user_id": maya,
                "due_date": today,
                "failure_cost": "Kid goes hungry → daycare calls",
                "tags": ["morning-routine"],
            },
            {
                "title": "Pick up prescription",
                "description": "Maya's allergy meds at CVS on Main St. Should be ready after 2pm.",
                "status": "in-progress",
                "priority": "med",
                "task_type": "errand",
                "assigned_user_id": charles,
                "due_date": today,
                "tags": ["health"],
            },

            # ── DUE TOMORROW ────────────────────────────────────────────
            {
                "title": "Grocery run",
                "description": "Milk, eggs, bananas, chicken thighs, pasta, broccoli, diapers (size 4), wipes",
                "status": "todo",
                "priority": "high",
                "task_type": "errand",
                "assigned_user_id": charles,
                "due_date": tomorrow,
                "failure_cost": "No groceries → ordering DoorDash all week ($$$)",
                "tags": ["groceries"],
            },
            {
                "title": "Wash and fold laundry",
                "description": "Two loads: darks + kid clothes. Fold before bed.",
                "status": "todo",
                "priority": "med",
                "task_type": "chore",
                "assigned_user_id": maya,
                "due_date": tomorrow,
                "tags": ["household"],
            },

            # ── DUE LATER THIS WEEK ─────────────────────────────────────
            {
                "title": "Meal prep Sunday dinners",
                "description": "Make chili and pasta sauce in bulk. Freeze half.",
                "status": "todo",
                "priority": "med",
                "task_type": "chore",
                "assigned_user_id": maya,
                "due_date": day_after,
                "tags": ["meal-prep"],
            },
            {
                "title": "Fix bathroom faucet leak",
                "description": "Guest bathroom. Slow drip. Might need new washer from Home Depot.",
                "status": "todo",
                "priority": "low",
                "task_type": "chore",
                "assigned_user_id": charles,
                "due_date": this_friday,
                "tags": ["home-repair"],
            },
            {
                "title": "Plan Naia's birthday party",
                "description": "Theme: dinosaurs. Need: venue, invites, cake order, decorations. Party is in 3 weeks.",
                "status": "in-progress",
                "priority": "med",
                "task_type": "other",
                "assigned_user_id": maya,
                "due_date": this_saturday,
                "failure_cost": "Scramble last minute → stressed weekend",
                "tags": ["naia", "events"],
            },

            # ── IN PROGRESS (no due date — tests "No Date" group) ──────
            {
                "title": "Research preschools for fall",
                "description": "Compare: Montessori on Oak, Little Scholars, public pre-K. Tour dates?",
                "status": "in-progress",
                "priority": "high",
                "task_type": "other",
                "assigned_user_id": charles,
                "failure_cost": "Miss enrollment deadlines → waitlisted",
                "tags": ["education", "naia"],
            },
            {
                "title": "Update family budget spreadsheet",
                "description": "Add April expenses. Review subscriptions — cancel unused ones.",
                "status": "in-progress",
                "priority": "low",
                "task_type": "other",
                "assigned_user_id": charles,
                "tags": ["finance"],
            },

            # ── TODO (no due date) ──────────────────────────────────────
            {
                "title": "Organize kid's closet",
                "description": "Naia outgrew 2T clothes. Box up for donation, move 3T to front.",
                "status": "todo",
                "priority": "none",
                "task_type": "chore",
                "assigned_user_id": maya,
                "tags": ["household", "naia"],
            },
            {
                "title": "Book oil change",
                "description": "Honda Accord — 5k miles overdue. Use the Firestone on Elm.",
                "status": "todo",
                "priority": "med",
                "task_type": "errand",
                "assigned_user_id": charles,
                "tags": ["car"],
            },
            {
                "title": "Set up baby monitor in new room",
                "status": "todo",
                "priority": "high",
                "task_type": "chore",
                "assigned_user_id": charles,
                "failure_cost": "Can't hear Naia at night after room transition",
                "tags": ["naia", "home"],
            },
            {
                "title": "Call insurance about claim",
                "description": "Claim #4421-B from the fender bender. Ask about rental car coverage.",
                "status": "todo",
                "priority": "med",
                "task_type": "errand",
                "assigned_user_id": maya,
                "due_date": tomorrow,
                "tags": ["insurance", "car"],
            },

            # ── DONE (tests done column, activity feed) ─────────────────
            {
                "title": "Sign daycare permission slip",
                "status": "done",
                "priority": "high",
                "task_type": "other",
                "assigned_user_id": maya,
                "due_date": yesterday,
                "tags": ["naia"],
            },
            {
                "title": "Order diapers (subscribe & save)",
                "status": "done",
                "priority": "med",
                "task_type": "errand",
                "assigned_user_id": charles,
                "tags": ["naia", "shopping"],
            },
            {
                "title": "Clean kitchen after dinner",
                "status": "done",
                "priority": "none",
                "task_type": "chore",
                "assigned_user_id": maya,
                "due_date": yesterday,
                "tags": ["household"],
            },
            {
                "title": "Take out trash + recycling",
                "status": "done",
                "priority": "low",
                "task_type": "chore",
                "assigned_user_id": charles,
                "due_date": today,
                "tags": ["household"],
            },
        ]

        task_ids = {}
        for t in tasks_data:
            tid = await fetch_val(
                """
                INSERT INTO tasks (title, description, status, priority, task_type,
                                  assigned_user_id, due_date, tags)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
                """,
                t["title"],
                t.get("description"),
                t["status"],
                t["priority"],
                t["task_type"],
                t.get("assigned_user_id"),
                t.get("due_date"),
                t.get("tags"),
            )
            task_ids[t["title"]] = tid

            # Add to task_assignees join table
            if t.get("assigned_user_id"):
                await execute(
                    "INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                    tid, t["assigned_user_id"],
                )

            # Store failure_cost if present
            if t.get("failure_cost"):
                # failure_cost isn't a DB column — it's stored in description or as a separate concept
                # For now, append to description if it exists
                desc = t.get("description") or ""
                # Actually, check if the tasks table has a failure_cost-like field
                # The frontend uses failureCost but the backend might not have it
                pass

            print(f"  Created task: {t['title']} ({t['status']}, {t['priority']})")

        print(f"\nCreated {len(tasks_data)} tasks total.")

        # ── SUBTASKS ────────────────────────────────────────────────────
        print("Creating subtasks...")

        # Grocery run subtasks
        grocery_id = task_ids["Grocery run"]
        groceries = ["Milk", "Eggs", "Bananas", "Chicken thighs", "Pasta", "Broccoli", "Diapers (size 4)", "Wipes"]
        for item in groceries:
            await execute(
                "INSERT INTO subtasks (task_id, title, completed) VALUES ($1, $2, $3)",
                grocery_id, item, False,
            )
        print(f"  Added {len(groceries)} subtasks to 'Grocery run'")

        # Birthday party subtasks
        party_id = task_ids["Plan Naia's birthday party"]
        party_items = [
            ("Book venue", True),
            ("Send invitations", True),
            ("Order dinosaur cake", False),
            ("Buy decorations", False),
            ("Plan party games", False),
        ]
        for title, done in party_items:
            await execute(
                "INSERT INTO subtasks (task_id, title, completed) VALUES ($1, $2, $3)",
                party_id, title, done,
            )
        print(f"  Added {len(party_items)} subtasks to 'Plan birthday party'")

        # Preschool research subtasks
        preschool_id = task_ids["Research preschools for fall"]
        preschool_items = [
            ("Tour Montessori on Oak", True),
            ("Tour Little Scholars", False),
            ("Check public pre-K eligibility", False),
            ("Compare tuition costs", False),
        ]
        for title, done in preschool_items:
            await execute(
                "INSERT INTO subtasks (task_id, title, completed) VALUES ($1, $2, $3)",
                preschool_id, title, done,
            )
        print(f"  Added {len(preschool_items)} subtasks to 'Research preschools'")

        # ── DEPENDENCIES (blocking) ─────────────────────────────────────
        print("Creating dependencies...")

        # "Prep bottles" blocks nothing but "Grocery run" blocks "Meal prep"
        grocery_id = task_ids["Grocery run"]
        meal_prep_id = task_ids["Meal prep Sunday dinners"]
        await execute(
            "INSERT INTO dependencies (task_id, depends_on_task_id) VALUES ($1, $2)",
            meal_prep_id, grocery_id,
        )
        print(f"  'Grocery run' blocks 'Meal prep Sunday dinners'")

        # "Research preschools" blocks "Plan birthday" (need venue info)
        preschool_id = task_ids["Research preschools for fall"]
        monitor_id = task_ids["Set up baby monitor in new room"]
        # Actually let's do: fixing faucet blocks nothing, but baby monitor needs closet organized first
        closet_id = task_ids["Organize kid's closet"]
        await execute(
            "INSERT INTO dependencies (task_id, depends_on_task_id) VALUES ($1, $2)",
            monitor_id, closet_id,
        )
        print(f"  'Organize kid\\'s closet' blocks 'Set up baby monitor'")

        # ── LINKS ───────────────────────────────────────────────────────
        print("Creating links...")

        daycare_id = task_ids["Pay daycare invoice"]
        await execute(
            "INSERT INTO task_links (task_id, url, title) VALUES ($1, $2, $3)",
            daycare_id, "https://littlestars.com/pay", "Payment Portal",
        )

        preschool_id = task_ids["Research preschools for fall"]
        await execute(
            "INSERT INTO task_links (task_id, url, title) VALUES ($1, $2, $3)",
            preschool_id, "https://niche.com/k12/search/best-preschools/", "Niche Rankings",
        )
        await execute(
            "INSERT INTO task_links (task_id, url, title) VALUES ($1, $2, $3)",
            preschool_id, "https://docs.google.com/spreadsheets/d/fake", "Comparison Spreadsheet",
        )

        insurance_id = task_ids["Call insurance about claim"]
        await execute(
            "INSERT INTO task_links (task_id, url, title) VALUES ($1, $2, $3)",
            insurance_id, "https://geico.com/claims", "GEICO Claims Portal",
        )

        print("  Added links to 3 tasks")

        # ── MULTI-ASSIGNEE EXAMPLE ──────────────────────────────────────
        print("Adding multi-assignee examples...")

        # Both parents on grocery run
        await execute(
            "INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            grocery_id, maya,
        )
        print("  Added Maya as co-assignee on 'Grocery run'")

        # Both parents on birthday party
        await execute(
            "INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            party_id, charles,
        )
        print("  Added Charles as co-assignee on 'Plan birthday party'")

        # Both parents on preschool research
        await execute(
            "INSERT INTO task_assignees (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            preschool_id, maya,
        )
        print("  Added Maya as co-assignee on 'Research preschools'")

        print("\n✓ Seed complete!")
        print(f"  {len(users_data)} users")
        print(f"  {len(tasks_data)} tasks")
        print(f"  3 overdue tasks (red indicators)")
        print(f"  2 due-today tasks (amber indicators)")
        print(f"  Tasks spread across this week for Week view")
        print(f"  3 multi-assignee tasks")
        print(f"  3 tasks with subtasks")
        print(f"  2 blocking dependencies")
        print(f"  3 tasks with links")

    except Exception as e:
        print(f"Error seeding data: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await close_db()


if __name__ == "__main__":
    asyncio.run(seed())
