# DSA Daily Tracker

React frontend, Django REST API, and a hosted Supabase PostgreSQL database.

## Stack

- React + TypeScript + Vite
- Django + Django REST Framework
- Supabase: PostgreSQL database and authentication

## Supabase cloud setup

You create the Supabase project once; the app connects to it remotely. Do not share database passwords, service-role keys, or `.env` files in Git or chat.

1. Sign in at [Supabase](https://supabase.com/dashboard) and select **New project**.
2. Choose your organization, name the project `dsa-daily-tracker`, select a nearby region, and save the generated database password in a password manager.
3. Wait until the project is ready. In **Connect**, copy the **Project URL** and **Publishable key**.
4. In **Connect → Database**, copy the PostgreSQL **URI**. Put it in `backend/.env` as `DATABASE_URL`. This is private because it includes a password.
5. Copy `frontend/.env.example` to `frontend/.env` and add the Project URL and Publishable key. The publishable key is intentionally usable in the browser; security comes from Supabase Row Level Security and the Django API authorization that we will add next.
6. Copy `backend/.env.example` to `backend/.env`, set `DATABASE_URL`, then replace `DJANGO_SECRET_KEY` with a long random value.
7. In Supabase Dashboard, open **Authentication → Providers**. Enable **Email** and **Google**. For Google, Supabase will show a callback URL; add that exact URL to a Google Cloud OAuth client that we configure in the authentication step.

## Local setup

```bash
# Terminal 1: Django API
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

```bash
# Terminal 2: React app
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open the URL shown by Vite, normally `http://localhost:5173`. The page confirms the Django health endpoint once both servers are running.

## Docker setup

Docker Compose runs the Django API and serves the production React build through Nginx:

```bash
# Run from the repository root
docker compose --env-file frontend/.env up --build
```

Open `http://localhost:5173`. The API is available at `http://localhost:8000`.
The Compose setup uses the local SQLite database at `backend/db.sqlite3` and runs migrations when the backend starts.

To stop the containers:

```bash
docker compose down
```

## Project structure

```text
frontend/   React application; uses Supabase only for browser authentication
backend/    Django REST API; authoritative roles, data, streaks, and admin actions
prd.md      Product requirements document
```

## Security boundary

- Never commit `.env` files.
- The React app receives only Supabase's public Project URL and Publishable key.
- Django connects to Supabase PostgreSQL using the private database URI.
- Django, not React, will decide whether a user is an admin and will calculate all authoritative progress data.
