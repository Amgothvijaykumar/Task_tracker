# Production Containerized Deployment Guide 🚀

This repository is fully containerized using **Docker** and **Docker Compose** for seamless single-command production deployment on any Linux server, VPS (AWS EC2, DigitalOcean, Hetzner), or Cloud Container Service.

---

## 🏗️ Architecture

```
                      +-------------------+
                      |   Client Browser  |
                      +---------+---------+
                                |
                                | Port 80
                                v
               +---------------------------------+
               |  Nginx Web Server (Frontend)    |
               |  - Serves React Vite SPA        |
               |  - Proxies /api/ requests       |
               +----------------+----------------+
                                |
                                | Internal Network (Port 8000)
                                v
               +---------------------------------+
               |  Gunicorn WSGI (Django Backend) |
               |  - Supabase Auth Integration    |
               |  - PostgreSQL / SQLite DB       |
               +---------------------------------+
```

---

## ⚡ Quick Start (Docker Compose)

### 1. Clone the repository on your server
```bash
git clone https://github.com/Amgothvijaykumar/Task_tracker.git
cd Task_tracker
```

### 2. Configure Environment Variables (`.env`)
Create a `.env` file in the root directory:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret

# Django Backend Configuration
SECRET_KEY=your-production-django-secret-key
DEBUG=False
ALLOWED_HOSTS=*
CORS_ALLOWED_ORIGINS=http://localhost,http://yourdomain.com

# API Gateway Base URL
VITE_API_BASE_URL=/api
```

### 3. Build & Launch Containers
Run the following command to start both frontend and backend containers in detached mode:

```bash
docker compose up --build -d
```

### 4. Verify Running Containers
```bash
docker compose ps
```
Both `dsa_tracker_backend` and `dsa_tracker_frontend` should show state `Up`.

---

## 🔍 Management Commands

### View Application Logs
```bash
docker compose logs -f
```

### Run Django Migrations Manually
```bash
docker compose exec backend python manage.py migrate
```

### Create Admin Superuser (if needed)
```bash
docker compose exec backend python manage.py createsuperuser
```

### Stop Containers
```bash
docker compose down
```

---

## 🛡️ Production Security Checklist
1. **SSL/TLS Certificates**: Set up Let's Encrypt / Certbot or Cloudflare proxy in front of Port 80/443.
2. **Environment Secrets**: Never commit `.env` files to git repository.
3. **Database**: Point `DATABASE_URL` in `.env` to a managed PostgreSQL instance (e.g. Supabase Postgres or AWS RDS).
