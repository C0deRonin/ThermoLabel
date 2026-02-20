# ThermoLabel Quick Start Guide

## For Local Development (Embedded Database)

```bash
git clone https://github.com/C0deRonin/ThermoLabel.git
cd ThermoLabel
docker compose up -d
# Open http://localhost:3000
```

---

## For Connecting to External Database (Different Computer)

### Computer A (where PostgreSQL runs):

1. **PostgreSQL must listen on all interfaces:**
   ```bash
   sudo nano /etc/postgresql/15/main/postgresql.conf
   # Ensure: listen_addresses = '*'
   
   sudo systemctl restart postgresql
   ```

2. **Get your IP address:**
   ```bash
   hostname -I
   # Example: 192.168.1.100
   ```

---

### Computer B (where you run ThermoLabel):

1. **Clone and setup:**
   ```bash
   git clone https://github.com/C0deRonin/ThermoLabel.git
   cd ThermoLabel
   ```

2. **Create .env file:**
   ```bash
   cp .env.example .env
   ```

3. **Edit .env - Replace these lines:**
   ```env
   # Use IP address of Computer A (where PostgreSQL is)
   DATABASE_URL=postgresql://thermolabel_user:YOUR_PASSWORD@192.168.1.100:5432/thermolabel_db
   DB_HOST=192.168.1.100
   DB_PASSWORD=YOUR_PASSWORD
   
   # If accessing from remote, update this:
   NEXT_PUBLIC_API_URL=http://192.168.1.200:8000
   ```

4. **Test database connection:**
   ```bash
   docker run --rm postgres:15-alpine \
     psql postgresql://thermolabel_user:YOUR_PASSWORD@192.168.1.100:5432/thermolabel_db \
     -c "SELECT version();"
   ```

5. **Start with external database:**
   ```bash
   # Using automatic setup script
   bash setup-external-db.sh    # Linux/Mac
   setup-external-db.bat        # Windows
   
   # Or manually
   docker compose -f docker-compose.external-db.yml --env-file .env up -d
   ```

6. **Check status:**
   ```bash
   docker compose -f docker-compose.external-db.yml ps
   ```

7. **Open in browser:**
   - Frontend: http://localhost:3000 (or http://192.168.1.200:3000 from other computer)
   - Backend API: http://localhost:8000

---

## Common Scenarios

### Scenario 1: PostgreSQL on Server, ThermoLabel on Laptop

```
Server (192.168.1.50):          Laptop (192.168.1.100):
┌─────────────────────┐        ┌──────────────────────────┐
│  PostgreSQL:5432    │◄───────│ ThermoLabel              │
│  (listen_addresses  │        │  Frontend:3000           │
│   = '*')            │        │  Backend:8000            │
└─────────────────────┘        └──────────────────────────┘
```

**On Laptop .env:**
```
DATABASE_URL=postgresql://user:pass@192.168.1.50:5432/thermolabel_db
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Scenario 2: PostgreSQL in Docker on Computer A, ThermoLabel on Computer B

```
Computer A:                    Computer B:
┌──────────────────┐          ┌──────────────────┐
│ Docker:          │          │ Docker Compose:  │
│ PostgreSQL:5432  │◄─────────│ ThermoLabel      │
│ (published port) │          │                  │
└──────────────────┘          └──────────────────┘
```

**On Computer A, ensure PostgreSQL container publishes port 5432:**
```yaml
services:
  postgres:
    ports:
      - "5432:5432"  # This makes it accessible from outside
```

**On Computer B .env:**
```
DATABASE_URL=postgresql://user:pass@192.168.1.50:5432/thermolabel_db
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Connection refused" | Check PostgreSQL is listening: `sudo systemctl status postgresql` |
| "password authentication failed" | Verify password in .env and in PostgreSQL |
| "502 Bad Gateway" | Ensure Backend is running: `docker compose logs backend` |
| "Cannot connect from laptop" | Check firewall: `sudo ufw allow 5432` |
| Backend cannot connect to DB | Test from container: `docker exec thermolabel-backend psql $DATABASE_URL -c "SELECT 1;"` |

---

## Files Explained

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Local dev with embedded PostgreSQL |
| `docker-compose.external-db.yml` | With external PostgreSQL (other computer) |
| `.env.example` | Template for configuration |
| `.env` | Your actual configuration (gitignored) |
| `DEPLOYMENT.md` | Full deployment guide |
| `setup-external-db.sh` | Automated setup for Linux/Mac |
| `setup-external-db.bat` | Automated setup for Windows |

---

## Ports

- **Frontend:** 3000
- **Backend API:** 8000
- **PostgreSQL:** 5432 (only if local with `docker-compose.yml`)

Change ports in `.env`:
```env
FRONTEND_PORT=3001
BACKEND_PORT=8001
```

---

## Stopping & Cleaning

```bash
# Stop services (keep data)
docker compose -f docker-compose.external-db.yml down

# Stop and remove everything (WARNING: loses local data)
docker compose -f docker-compose.external-db.yml down -v

# View logs
docker compose -f docker-compose.external-db.yml logs -f

# Restart
docker compose -f docker-compose.external-db.yml restart
```

---

## Database Backup & Restore

### Backup
```bash
docker exec thermolabel-db pg_dump -U thermolabel_user -d thermolabel_db > backup.sql
```

### Restore
```bash
docker exec -i thermolabel-db psql -U thermolabel_user -d thermolabel_db < backup.sql
```

---

## Performance Tips

1. Use **external database** if possible (dedicated server)
2. Set `NODE_ENV=production` for Frontend in .env
3. Use reverse proxy (nginx) for production
4. Enable Docker resource limits in `.env`

---

For detailed information, see **DEPLOYMENT.md**
