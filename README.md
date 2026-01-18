To run this project, you'll need to start both the backend (FastAPI + PostgreSQL) and the frontend (Next.js).

1. Backend Setup (Docker)
The backend runs in Docker containers. Make sure Docker is running on your machine.

Open a terminal and navigate to the backend directory:
cd backend
Start the services:
docker-compose up --build -d
Run database migrations:
docker-compose exec backend alembic upgrade head
(Optional) Seed the database with initial data:
docker-compose exec backend python seed_data.py
The backend API will be available at http://localhost:8001 and the documentation at http://localhost:8001/docs.

2. Frontend Setup (Bun)
The frontend uses Bun as the package manager.

Navigate back to the project root:
cd ..
Install dependencies:
bun install
Start the development server:
bun dev
The application will be available at http://localhost:3000.

Environment Variables
Frontend: .env.local is already configured to point to the backend at http://localhost:8001.
Backend: .env and docker-compose.yml handle the database connection.