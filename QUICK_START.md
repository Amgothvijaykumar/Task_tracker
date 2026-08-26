# 🚀 Quick Start Guide - DSA Daily Tracker

## Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

---

## 🏃 Get Running in 5 Minutes

### Terminal 1: Backend
```bash
cd /Users/amgothvijaykumar/Documents/Codex/2026-08-18/ca

# One-time setup
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
cd backend
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

**Output:** `Starting development server at http://0.0.0.0:8000/`

### Terminal 2: Frontend
```bash
cd /Users/amgothvijaykumar/Documents/Codex/2026-08-18/ca

# One-time setup (first time only)
cd frontend
npm install
npm run dev
```

**Output:** `VITE v7.x.x ready in XXX ms`

### Open Browser
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 🧪 Test Login

### Admin Account
- **Email:** `admin@dsatracker.test`
- **Password:** `password`
- **Redirect:** `/admin` dashboard

### Student Account
- **Email:** `ravi@dsatracker.test`
- **Password:** `password`
- **Redirect:** `/dashboard`

---

## 📂 Project Files Created/Modified

### Backend Files
```
backend/
├── config/
│   ├── settings.py (✏️ Updated with Supabase config)
│   └── urls.py
├── tracker/
│   ├── models.py (✏️ Created: User, Problem, Tag, Progress, etc.)
│   ├── views.py (✏️ Created: Auth endpoints)
│   ├── urls.py (✏️ Updated: Auth routes)
│   ├── serializers.py (✏️ Created: DRF serializers)
│   ├── permissions.py (✏️ Created: Role-based access)
│   ├── middleware.py (✏️ Created: Supabase JWT extraction)
│   ├── management/commands/seed_data.py (✏️ Created)
│   └── migrations/0001_initial.py (✏️ Generated)
├── .env (✏️ Updated)
└── requirements.txt
```

### Frontend Files
```
frontend/
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx (✏️ Created)
│   ├── components/
│   │   └── ProtectedRoute.tsx (✏️ Created)
│   ├── pages/
│   │   ├── LoginPage.tsx (✏️ Created)
│   │   ├── StudentDashboard.tsx (✏️ Created)
│   │   ├── AdminPanel.tsx (✏️ Created)
│   │   └── UnauthorizedPage.tsx (✏️ Created)
│   ├── App.tsx (✏️ Updated: Router setup)
│   ├── main.tsx (✔️ No changes)
│   └── styles.css (✔️ Tailwind ready)
├── package.json (✏️ Added: react-router-dom)
├── tsconfig.json (✔️ No changes)
├── vite.config.ts (✔️ No changes)
└── .env (✔️ Configured)
```

---

## ✅ Verification Checklist

After running both servers:

- [ ] Backend health: `curl http://localhost:8000/api/health/`
  - Expected: `{"service": "DSA Daily Tracker API", "status": "healthy"}`

- [ ] Frontend loads: Visit `http://localhost:5173`
  - Expected: Login page with email/password and Google OAuth button

- [ ] Login works: Try `admin@dsatracker.test` / `password`
  - Expected: Redirect to `/admin` with KPI cards

- [ ] Student login works: Try `ravi@dsatracker.test` / `password`
  - Expected: Redirect to `/dashboard` with streak cards

- [ ] Logout works: Click sign out button
  - Expected: Redirect to login page

---

## 🛠️ Useful Commands

### Backend
```bash
# Activate virtual environment
source venv/bin/activate

# Run migrations
python manage.py migrate

# Create new migration
python manage.py makemigrations tracker

# Seed data
python manage.py seed_data

# Run tests (when added)
python manage.py test

# Django shell
python manage.py shell

# Deactivate virtual environment
deactivate
```

### Frontend
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 🔗 Important URLs

| Page | URL | Role | Status |
|------|-----|------|--------|
| Login | `http://localhost:5173/login` | All | ✅ Ready |
| Student Dashboard | `http://localhost:5173/dashboard` | Student | ✅ Starter page |
| Admin Panel | `http://localhost:5173/admin` | Admin | ✅ Starter page |
| Unauthorized | `http://localhost:5173/unauthorized` | All | ✅ Ready |
| Health Check | `http://localhost:8000/api/health/` | All | ✅ Ready |

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is in use
lsof -i :8000

# Use different port
python manage.py runserver 8001
```

### Frontend build errors
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### Database errors
```bash
# Reset SQLite database
rm backend/db.sqlite3
cd backend
python manage.py migrate
python manage.py seed_data
```

### Auth not working
- Check `.env` files have correct Supabase credentials
- Frontend `.env` must have `VITE_` prefix
- Backend `.env` must NOT have `VITE_` prefix

---

## 📚 Documentation

- **Foundation Phase:** [FOUNDATION_PHASE_COMPLETE.md](./FOUNDATION_PHASE_COMPLETE.md)
- **Product Requirements:** [prd.md](./prd.md)
- **Django Docs:** https://docs.djangoproject.com/
- **React Docs:** https://react.dev/
- **Supabase Docs:** https://supabase.com/docs

---

## 🎯 Next Phase: Core Tracking

The Foundation Phase provides:
- ✅ Authentication framework
- ✅ Database schema
- ✅ Protected routes
- ✅ Starter pages with empty states

**Phase 1** will add:
- Problem CRUD for admins
- Problem feed for students
- Status tracking
- Real data on dashboards

---

**Happy coding! 🚀**
