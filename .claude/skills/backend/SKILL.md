---
name: backend
description: Start the backend services (FastAPI + PostgreSQL) via Docker Compose.
disable-model-invocation: true
---

Start the backend stack:

```bash
docker compose -f backend/docker-compose.yml up --build -d
```

Then verify the backend is healthy:

```bash
# Wait for backend to be ready (up to 30s)
for i in $(seq 1 15); do
  if curl -s http://localhost:8001/docs > /dev/null 2>&1; then
    echo "Backend is ready at http://localhost:8001"
    break
  fi
  sleep 2
done
```

If the backend doesn't come up, check logs with:
```bash
docker compose -f backend/docker-compose.yml logs --tail=50
```
