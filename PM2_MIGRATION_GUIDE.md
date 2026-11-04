# PM2 + Docker Hybrid Hosting & CI/CD Deployment Guide

This guide details the migration of **CRT-NEW** from pure Docker to a **hybrid PM2 + Docker setup** tailored for your AWS Lightsail server.

---

## 1. Server Profile (From Provided Details)

- **Provider**: AWS Lightsail (Mumbai `ap-south-1a`)
- **Public IP**: `13.206.203.113`
- **Private IP**: `172.26.12.254`
- **User**: `ubuntu`
- **OS**: Ubuntu 24.04.4 LTS (Kernel 6.17.0-1010-aws x86_64)
- **RAM**: 3.7 GiB total (1.7 GiB in use by existing apps, ~2.1 GiB available, 2.0 GiB swap)
- **Disk**: 77 GB (~65 GB available)

> [!IMPORTANT]
> **Port Allocation Notice:**
> The server runs an existing face-recognition / AI service on host port `8000`. To prevent collisions:
> - **CRT Backend** runs on host port **`5000`** under PM2.
> - **CRT Frontend** runs on host port **`3000`** under PM2 (`pm2 serve`).
> - **CRT Speech AI** runs on `127.0.0.1:8001` in Docker.
> - **MongoDB** connects directly to **MongoDB Atlas Cloud** (`teampydah.y4zj6wh.mongodb.net/crt1`), so no local database container is needed!
> - **Nginx** listens on public port **`80`** (and `443` if SSL) and routes traffic seamlessly to Frontend, Backend, and WebSockets.

---

## 2. Architecture Diagram

```
Public Traffic (Internet)
         │
         ▼
[ Lightsail Port 80 / 443 (Nginx) ]
    ├── /api/*        ──► http://127.0.0.1:5000  (PM2: crt-backend)
    ├── /socket.io/*  ──► http://127.0.0.1:5000  (PM2: crt-backend WebSockets)
    └── /*            ──► http://127.0.0.1:3000  (PM2: crt-frontend SPA serve)
                                  │
                   ┌──────────────┴──────────────┐
                   ▼                             ▼
      [ MongoDB Atlas Cloud DB ]      [ Docker: crt-ai-server ]
       teampydah.y4zj6wh.mongodb.net          127.0.0.1:8001
```

---

## 3. One-Time Server Setup (Run in Lightsail SSH Terminal)

### Step 3.1: Install Node.js 20, PM2 & Nginx

```bash
# Update package index
sudo apt update && sudo apt install -y curl git nginx

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node and npm
node -v # Should be v20.x
npm -v

# Install PM2 globally
sudo npm install -g pm2
```

### Step 3.2: Clone or Position Repository

```bash
cd /home/ubuntu
# If cloning fresh:
git clone https://github.com/Pydah-Soft-Projects/CRT-NEW.git
cd CRT-NEW
mkdir -p logs
```

### Step 3.3: Configure Environment Files

Create the backend `.env`:
```bash
cp backend/.env.example backend/.env
nano backend/.env
```
Key settings in `backend/.env`:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://teampydah:TeamPydah@teampydah.y4zj6wh.mongodb.net/crt1
AI_SERVER_URL=http://127.0.0.1:8001
JWT_SECRET_KEY=versant_jwt_secret_key_2024_secure_and_unique
JWT_REFRESH_SECRET_KEY=versant_jwt_refresh_secret_key_2024
CORS_ORIGINS=http://localhost:3000,http://13.206.203.113
```

### Step 3.4: Start Docker AI Service

```bash
cd /home/ubuntu/CRT-NEW
docker compose -f docker-compose.infra.yml up -d --build
docker ps
```

### Step 3.5: Build Frontend & Start PM2 Services

```bash
# Install backend dependencies
cd /home/ubuntu/CRT-NEW/backend
npm install --omit=dev

# Install frontend dependencies and build
cd /home/ubuntu/CRT-NEW/frontend
npm install
npm run build

# Start both services with PM2
cd /home/ubuntu/CRT-NEW
pm2 start ecosystem.config.cjs

# Check PM2 status
pm2 status

# Save PM2 process list and configure auto-start on server reboot
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

### Step 3.6: Configure Nginx

Copy the provided Nginx configuration to sites-available:
```bash
sudo cp /home/ubuntu/CRT-NEW/nginx.conf.example /etc/nginx/sites-available/crt
sudo ln -s /etc/nginx/sites-available/crt /etc/nginx/sites-enabled/crt

# Remove default Nginx site if not needed:
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx:
sudo nginx -t
sudo systemctl reload nginx
```

---

## 4. GitHub Actions CI/CD Setup

The workflow is ready at `.github/workflows/deploy.yml`.

### Step 4.1: Download SSH Key from AWS Lightsail

In your Lightsail console (visible in your screenshot):
1. Under **"Connect using SSH"** -> **"SSH key"**, click **`Download default key`**.
2. Save the `.pem` file and open it in a text editor (e.g. Notepad).
3. Copy the entire file content (including `-----BEGIN RSA PRIVATE KEY-----` to `-----END RSA PRIVATE KEY-----`).

### Step 4.2: Add GitHub Repository Secrets

In your GitHub repository:
Go to **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**:

| Secret Name | Value | Notes |
|---|---|---|
| `SERVER_HOST` | `13.206.203.113` | Your Lightsail Public IPv4 address |
| `SERVER_USER` | `ubuntu` | Lightsail default username |
| `SERVER_SSH_KEY` | *(Paste content of downloaded .pem file)* | Private SSH Key |
| `SERVER_PORT` | `22` *(optional)* | Default is 22 |
| `SERVER_APP_DIR` | `/home/ubuntu/CRT-NEW` *(optional)* | Path where project is located |

### Step 4.3: How the Deployment Workflow Operates

1. **Build Step**:
   - The frontend is built on GitHub's build runner (saving CPU/RAM on your Lightsail instance).
   - The built `dist/` is uploaded via SCP to `/home/ubuntu/CRT-NEW/frontend/dist`.
2. **Deploy Step (via SSH)**:
   - Pulls the latest Git code onto the server.
   - Starts or updates Docker services (`docker-compose.infra.yml` for MongoDB and AI Speech service).
   - Installs backend dependencies (`npm install --omit=dev`).
   - Reloads PM2 (`pm2 reload ecosystem.config.cjs`).
   - Saves PM2 state (`pm2 save`).

You can trigger this automatically by pushing to `main` or manually via **Actions** -> **Deploy to AWS Lightsail** with target options (`all`, `backend`, `frontend`, `infra-ai`).

---

## 5. Maintenance & Useful Commands

| Task | Command |
|---|---|
| Check PM2 process status | `pm2 status` |
| View backend live logs | `pm2 logs crt-backend` |
| View frontend live logs | `pm2 logs crt-frontend` |
| Real-time CPU/RAM monitor | `pm2 monit` |
| Restart backend | `pm2 restart crt-backend` |
| Check Docker containers | `docker ps` |
| Check Docker logs (AI server) | `docker compose -f docker-compose.infra.yml logs -f ai-server` |
| Test Nginx routing | `curl -i http://localhost/nginx-health` |
| Test Backend API health | `curl -i http://localhost/api/health` |

