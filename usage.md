Summary

  Created a Python FastAPI backend in /backend with:

  Files Created (25 files)

  - Config: config.py, database.py, .env, .env.example
  - Alembic: alembic.ini, env.py, 3 migration files
  - Models: user.py, task.py, dependency.py
  - Services: user_service.py, task_service.py, dependency_service.py, cycle_detection.py
  - Routers: users.py, tasks.py, dependencies.py
  - Main: main.py
  - Docker: Dockerfile, docker-compose.yml
  - Tests: conftest.py, test_users.py, test_tasks.py, test_dependencies.py

  Running the Backend

  cd backend
  docker-compose up --build -d    # Start containers
  docker-compose exec backend alembic upgrade head   # Run migrations
  docker-compose exec backend pytest -v   # Run tests

  Endpoints
  ┌────────────────────────────────┬──────────────────────────┐
  │            Endpoint            │       Description        │
  ├────────────────────────────────┼──────────────────────────┤
  │ GET /health                    │ Health check             │
  ├────────────────────────────────┼──────────────────────────┤
  │ GET /docs                      │ OpenAPI documentation    │
  ├────────────────────────────────┼──────────────────────────┤
  │ Users /api/users               │ Full CRUD                │
  ├────────────────────────────────┼──────────────────────────┤
  │ Tasks /api/tasks               │ CRUD + filtering/sorting │
  ├────────────────────────────────┼──────────────────────────┤
  │ Dependencies /api/dependencies │ CRUD + cycle detection   │
  └────────────────────────────────┴──────────────────────────┘
  Verified Features

  - User CRUD with email uniqueness
  - Task CRUD with assignee validation
  - Filtering by status, priority, assignee
  - Sorting by priority, due_date, created_at
  - Dependency creation with cycle detection
  - blocking/blocked_by arrays in task responses

  OpenAPI docs: http://localhost:8001/docs
