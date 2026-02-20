# ThermoLabel - Thermal Image Annotation Tool

Complete Docker-based solution for thermal image annotation and analysis.

## Quick Start

### Prerequisites

- Docker
- Docker Compose
- Git

### Installation & Run

1. **Clone the repository**
   ```bash
   git clone https://github.com/C0deRonin/ThermoLabel.git
   cd ThermoLabel
   ```

2. **Prepare your database dump (optional)**
   ```bash
   # If you have existing data, export it:
   pg_dump -U username -d thermolabel_db > database-dump.sql
   
   # Place the dump file in the project root
   # The file must be named: database-dump.sql
   ```

3. **Start all services**
   ```bash
   docker compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

5. **Stop services**
   ```bash
   docker compose down
   ```

---

## Database Initialization

### First Time Setup (Empty Database)

Docker will automatically:
1. Create the PostgreSQL database
2. Initialize tables from `backend/init-db.sql`
3. Load any data from `database-dump.sql` (if exists)

### Restore from Existing Dump

1. Export your database:
   ```bash
   pg_dump -U thermolabel_user -d thermolabel_db > database-dump.sql
   ```

2. Copy file to project root:
   ```bash
   cp database-dump.sql /path/to/ThermoLabel/
   ```

3. Start services:
   ```bash
   docker compose up -d
   ```

---

## Backup & Restore

### Create Backup

```bash
docker exec thermolabel-db pg_dump -U thermolabel_user -d thermolabel_db > backup.sql
```

### Restore Backup

```bash
docker exec -i thermolabel-db psql -U thermolabel_user -d thermolabel_db < backup.sql
```

---

## Services

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 3000 | Next.js web application |
| Backend | 8000 | FastAPI REST API |
| Database | 5432 | PostgreSQL database |

---

## API Endpoints

### Health & Info
- `GET /api/health` - Health check
- `GET /api/supported-formats` - Get supported file formats

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/{id}` - Get project details
- `POST /api/projects` - Create/update project
- `DELETE /api/projects/{id}` - Delete project

### Settings
- `GET /api/settings/classes` - Get class definitions
- `PUT /api/settings/classes` - Update class definitions

### Analysis
- `POST /api/detect-anomalies` - Detect temperature anomalies
- `POST /api/validate-annotations` - Validate annotations
- `POST /api/process-flir` - Process FLIR thermal image

---

## Development

### Run Tests

```bash
docker exec thermolabel-backend pytest tests/ -v --cov
```

### View Logs

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

### Access Database

```bash
docker exec -it thermolabel-db psql -U thermolabel_user -d thermolabel_db
```

---

## Project Structure

```
ThermoLabel/
├── backend/
│   ├── app/
│   │   ├── api/              # API routes (Presentation Layer)
│   │   ├── core/             # Config, database, exceptions
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   ├── repositories/     # Data access layer
│   │   └── __init__.py      # App factory
│   ├── tests/                # Unit and integration tests
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── init-db.sql          # Database schema
│   └── main.py              # Entrypoint
├── frontend/
│   ├── pages/                # Next.js pages
│   ├── components/           # React components
│   ├── lib/                  # Utilities
│   └── Dockerfile.frontend
├── docker-compose.yml        # Docker services
├── database-dump.sql        # Database data (optional)
└── README.md
```

---

## Architecture

### Backend (FastAPI + SOLID Principles)

```
Routes (API) → Services (Business Logic) → Repositories (Data Access) → Database
```

**SOLID Implementation:**
- **Single Responsibility**: Each class has one reason to change
- **Open/Closed**: Repositories are open for extension
- **Liskov Substitution**: Base repository can be replaced by subclasses
- **Interface Segregation**: Interfaces are specific to client needs
- **Dependency Inversion**: Services depend on abstractions (repositories)

### Database Schema

- `projects` - Thermal image projects with annotations
- `app_settings` - Application settings storage

---

## Environment Variables

Backend uses environment from docker-compose.yml:

```env
DATABASE_URL=postgresql://thermolabel_user:thermolabel_password@postgres:5432/thermolabel_db
DEBUG=false
```

---

## Troubleshooting

### Port Already in Use

```bash
# Change ports in docker-compose.yml
# Or stop conflicting services:
docker compose down
```

### Database Connection Issues

```bash
# Check database logs
docker compose logs postgres

# Test connection
docker exec thermolabel-db pg_isready
```

### Container Exited

```bash
# View error logs
docker compose logs backend
docker compose logs frontend

# Restart services
docker compose restart
```

---

## Performance Tips

1. **Use PostgreSQL backups** for data preservation
2. **Monitor resource usage**: `docker stats`
3. **Enable production mode** by setting `NODE_ENV=production` in docker-compose.yml
4. **Use named volumes** for database persistence

---

## License

MIT License - See LICENSE file

---

## Support

For issues and questions, please create an issue on GitHub:
https://github.com/C0deRonin/ThermoLabel/issues
