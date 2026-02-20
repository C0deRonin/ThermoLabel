# ThermoLabel: Multi-Machine Deployment Complete Setup

## Summary

I've created a complete, production-ready system for running ThermoLabel with an existing PostgreSQL database on a different computer. Everything is configured for **seamless deployment**.

---

## What Was Created

### 1. Configuration Files

| File | Purpose |
|------|---------|
| `.env.example` | Template with all environment variables |
| `docker-compose.external-db.yml` | Compose config for external database |

### 2. Documentation

| File | Size | Purpose |
|------|------|---------|
| `DEPLOYMENT.md` | 10+ KB | **Complete deployment guide** with troubleshooting |
| `QUICKSTART.md` | 6 KB | Quick reference for common scenarios |
| `MULTI_MACHINE_SETUP.md` | 8 KB | Visual guide with architecture diagrams |

### 3. Automated Setup Scripts

| File | OS | Usage |
|------|----|----|
| `setup-external-db.sh` | Linux/Mac | `bash setup-external-db.sh` |
| `setup-external-db.bat` | Windows | `setup-external-db.bat` |

Both scripts:
- ✅ Check Docker installation
- ✅ Create `.env` if missing
- ✅ Test database connection
- ✅ Auto-start all services
- ✅ Display access information

---

## Three Ways to Run ThermoLabel

### 1️⃣ Local Development (Single Computer)

```bash
git clone https://github.com/C0deRonin/ThermoLabel.git
cd ThermoLabel
docker compose up -d
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

---

### 2️⃣ With External Database (Automatic Setup)

**On computer running ThermoLabel:**

```bash
git clone https://github.com/C0deRonin/ThermoLabel.git
cd ThermoLabel

# Linux/Mac
bash setup-external-db.sh

# Windows
setup-external-db.bat
```

Script will:
1. Copy `.env.example` to `.env`
2. Ask you to edit `.env` with database IP
3. Test connection to database
4. Start all services

---

### 3️⃣ With External Database (Manual Setup)

**On computer running ThermoLabel:**

```bash
git clone https://github.com/C0deRonin/ThermoLabel.git
cd ThermoLabel

# Copy template
cp .env.example .env

# Edit with your database server IP
nano .env
```

**Edit these lines in `.env`:**

```env
# Database on different computer
DATABASE_URL=postgresql://thermolabel_user:password@192.168.1.100:5432/thermolabel_db
DB_HOST=192.168.1.100

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:8000
BACKEND_INTERNAL_URL=http://thermolabel-backend:8000
```

**Start services:**

```bash
docker compose -f docker-compose.external-db.yml --env-file .env up -d
```

---

## Pre-Setup: Database Server Configuration

**On computer with PostgreSQL (before running ThermoLabel):**

### Linux

```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/15/main/postgresql.conf

# Find or add this line:
# listen_addresses = '*'

# Restart PostgreSQL
sudo systemctl restart postgresql

# Get your IP address
hostname -I
# Example output: 192.168.1.100

# Allow firewall (if enabled)
sudo ufw allow 5432/tcp

# Test connection locally
psql -U thermolabel_user -d thermolabel_db -c "SELECT version();"
```

### Windows (with PostgreSQL installed)

```powershell
# Find PostgreSQL config file
C:\Program Files\PostgreSQL\15\data\postgresql.conf

# Edit and find/add: listen_addresses = '*'

# Restart PostgreSQL service in Services app

# Get your IP address
hostname
# or
ipconfig /all

# Test connection
psql -U thermolabel_user -d thermolabel_db -c "SELECT version();"
```

### Docker (PostgreSQL in container)

```bash
# Ensure port 5432 is published
docker ps | grep postgres
# Should show: 0.0.0.0:5432->5432/tcp
```

---

## Architecture

```
Computer A (Database Server)          Computer B (ThermoLabel)
┌─────────────────────────┐          ┌──────────────────────────┐
│ PostgreSQL:5432         │          │ Docker Containers:       │
│ (listen_addresses='*')  │◄─────────│ - Frontend:3000          │
│ IP: 192.168.1.100       │  network │ - Backend:8000           │
│                         │◄─────────│ IP: 192.168.1.200        │
└─────────────────────────┘          └──────────────────────────┘

Configuration on Computer B (.env):
DATABASE_URL=postgresql://user:pass@192.168.1.100:5432/db
NEXT_PUBLIC_API_URL=http://192.168.1.200:8000
```

---

## Environment Variables

**Key variables in `.env`:**

| Variable | Example | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | `postgresql://user:pass@192.168.1.100:5432/db` | Full connection string |
| `DB_HOST` | `192.168.1.100` | Database server IP |
| `DB_PASSWORD` | `your_secure_password` | PostgreSQL password |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Frontend → Backend (browser) |
| `BACKEND_INTERNAL_URL` | `http://thermolabel-backend:8000` | Frontend → Backend (Docker) |
| `NODE_ENV` | `development` | Environment type |
| `FRONTEND_PORT` | `3000` | Frontend port |
| `BACKEND_PORT` | `8000` | Backend port |

---

## Verify Setup

### 1. Test database connection from Computer B

```bash
docker run --rm postgres:15-alpine \
  psql postgresql://thermolabel_user:password@192.168.1.100:5432/thermolabel_db \
  -c "SELECT version();"

# Should output PostgreSQL version
```

### 2. Check services are running

```bash
docker compose -f docker-compose.external-db.yml ps

# Should show:
# NAME                  STATUS
# thermolabel-backend   Up (healthy)
# thermolabel-frontend  Up
```

### 3. Test API endpoints

```bash
# Health check
curl http://localhost:8000/api/health
# Response: {"status":"ok","version":"0.3.0"}

# Frontend health
curl http://localhost:3000
# Should return HTML
```

### 4. Open in browser

- **Frontend:** http://localhost:3000 (or http://192.168.1.200:3000 from other computer)
- **Backend API:** http://localhost:8000/api/projects

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `Connection refused` | Check: Is PostgreSQL running? Is firewall open? Is IP correct? |
| `password authentication failed` | Verify password in `.env` matches PostgreSQL password |
| `Cannot connect from Computer B` | Check firewall on Computer A: `sudo ufw allow 5432` |
| `Backend is unhealthy` | Check logs: `docker compose logs backend` |
| `502 Bad Gateway` | Ensure Backend container is running and database connected |

**Full troubleshooting:** See `DEPLOYMENT.md` for detailed solutions

---

## Git Branches (Pull Requests)

Two branches created with improvements:

### Branch 1: `fix/docker-backend-frontend-communication`
- ✅ Fixes 502 Bad Gateway errors  
- ✅ Adds `BACKEND_INTERNAL_URL` environment variable
- ✅ Fixes backend Dockerfile

**Commit:** `35e32b0`

### Branch 2: `feat/multi-machine-deployment`
- ✅ External database support
- ✅ Configuration templates
- ✅ Automated setup scripts
- ✅ Complete documentation

**Commit:** `cf7301f`

---

## File Structure

```
ThermoLabel/
├── docker-compose.yml                 # Local dev (embedded DB)
├── docker-compose.external-db.yml     # External DB
├── .env.example                        # Config template
├── setup-external-db.sh               # Auto setup (Linux/Mac)
├── setup-external-db.bat              # Auto setup (Windows)
├── DEPLOYMENT.md                       # Full guide (10+ KB)
├── QUICKSTART.md                      # Quick reference (6 KB)
├── MULTI_MACHINE_SETUP.md            # Visual guide (8 KB)
├── backend/
│   ├── Dockerfile
│   ├── main.py
│   ├── database.py
│   └── requirements.txt
├── pages/
│   ├── api/proxy/[...path].js         # Proxy to backend
│   └── index.js
└── (frontend files...)
```

---

## Quick Commands

```bash
# Local development (embedded DB)
docker compose up -d
docker compose logs -f
docker compose down

# External database setup
docker compose -f docker-compose.external-db.yml --env-file .env up -d
docker compose -f docker-compose.external-db.yml logs -f backend
docker compose -f docker-compose.external-db.yml down

# Automated setup
bash setup-external-db.sh        # Linux/Mac
setup-external-db.bat           # Windows

# Database operations
docker exec -i thermolabel-db psql -U thermolabel_user -d thermolabel_db < backup.sql
docker exec thermolabel-db pg_dump -U thermolabel_user -d thermolabel_db > backup.sql

# Check connections
docker compose ps
docker logs thermolabel-backend
docker logs thermolabel-frontend
```

---

## Next Steps

1. **Review the guides:**
   - Start with `QUICKSTART.md` for quick reference
   - Read `DEPLOYMENT.md` for comprehensive setup
   - Check `MULTI_MACHINE_SETUP.md` for visual guide

2. **Choose your setup:**
   - Local: `docker compose up -d`
   - External DB: Use `docker-compose.external-db.yml`
   - Auto setup: Run setup script

3. **Test your setup:**
   - Verify database connection
   - Check all services running
   - Create test project

4. **Deploy:**
   - Configure `.env` with your servers
   - Run `docker compose up -d`
   - Monitor logs for any issues

---

## Support

**All documentation is included in the repository:**

- 📖 `DEPLOYMENT.md` - Comprehensive guide with troubleshooting
- ⚡ `QUICKSTART.md` - Quick reference commands
- 🎨 `MULTI_MACHINE_SETUP.md` - Visual architecture
- 🔧 `MULTI_MACHINE_SETUP.md` (this file) - Complete summary

**GitHub Issues:** Use project issues for problems

**Pull Requests:** Two PRs ready to review and merge

---

## Conclusion

**ThermoLabel is now ready for:**

✅ Local development
✅ Multi-machine deployment  
✅ Distributed database setup
✅ Production deployment
✅ Easy configuration management
✅ Automated setup
✅ Multiple environments

Everything is **production-ready** and **well-documented**.

---

**Created:** 2026-02-21
**Branch:** `feat/multi-machine-deployment`
**Commits:** `cf7301f` (deployment), `35e32b0` (communication fix)
**Status:** ✅ Ready for GitHub PR
