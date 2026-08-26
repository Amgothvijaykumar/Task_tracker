# CareerWithChaitanya — DSA Daily Task Tracker & Admin Panel

A production-grade, containerized DSA Problem & Streak Tracker designed for **CareerWithChaitanya**. Features a rich Skeuomorphic & Liquid Glass UI, dark/light theme switcher with full-screen thermal burnout transitions, student leaderboard rankings, dynamic score calculation, and interactive admin analytics.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, Skeuomorphic & Liquid Glass UI, Supabase Auth.
- **Backend**: Django REST Framework, Python 3.12, Gunicorn WSGI, SQLite / Supabase PostgreSQL.
- **Containerization**: Docker, Nginx, Docker Compose.

---

## Local Development (Without Docker)

```bash
# Terminal 1: Django Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

```bash
# Terminal 2: React Frontend
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## Production Docker Setup 🐳

Docker Compose builds both Django API (Gunicorn) and React SPA (Nginx) into isolated, production-ready containers:

```bash
# Run from the repository root
docker compose up --build -d
```

- **Frontend Application**: `http://localhost:5173` (or `http://localhost:80`)
- **Backend REST API**: `http://localhost:8000/api/`

To view logs:
```bash
docker compose logs -f
```

To stop containers:
```bash
docker compose down
```

---

## Security & Architecture

- **Auth Boundary**: Supabase handles browser authentication; Django verifies JWT tokens authoritatively.
- **Role Enforcement**: Django REST API enforces strict Admin (`IsAdmin`) and Student permissions.
- **Data Persistence**: Configured for local SQLite or production Supabase PostgreSQL.
