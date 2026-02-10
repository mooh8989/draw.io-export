# Deployment & Production Guide

## Overview

This guide covers deploying the Draw.io Export REST API to production environments.

## Local Development

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm start

# 3. Visit web UI
open http://localhost:3000

# 4. Run tests (in another terminal)
node test-api.js
```

### Development with Nodemon

```bash
# Install nodemon globally
npm install -g nodemon

# Run with auto-reload
nodemon api.js
```

## Docker Deployment

### Option 1: Build & Run with Custom Dockerfile

```bash
# Build image
docker build -f Dockerfile.api -t drawio-export:latest .

# Run container
docker run -d \
  -p 3000:3000 \
  -e API_KEY=11223344zzz \
  -e NODE_ENV=production \
  --name drawio-export \
  drawio-export:latest

# Check logs
docker logs -f drawio-export

# Stop container
docker stop drawio-export
```

### Option 2: Docker Compose (Recommended)

```bash
# Start service
docker-compose -f docker-compose.api.yml up -d

# View logs
docker-compose -f docker-compose.api.yml logs -f drawio-export-api

# Stop service
docker-compose -f docker-compose.api.yml down

# Restart service
docker-compose -f docker-compose.api.yml restart drawio-export-api
```

### Option 3: Docker with Custom Network

```bash
# Create network
docker network create drawio-network

# Run container
docker run -d \
  -p 3000:3000 \
  --network drawio-network \
  --name drawio-export \
  -e API_KEY=your-secret-key \
  drawio-export:latest

# Test
curl http://localhost:3000/health
```

## Cloud Deployments

### Heroku Deployment

```bash
# 1. Install Heroku CLI
brew install heroku/brew/heroku

# 2. Login
heroku login

# 3. Create app
heroku create drawio-export

# 4. Set environment variables
heroku config:set API_KEY=your-secret-key

# 5. Deploy
git push heroku main

# 6. Check logs
heroku logs --tail
```

### AWS Lambda with Docker

```bash
# 1. Create ECR repository
aws ecr create-repository --repository-name drawio-export

# 2. Build and push image
docker build -f Dockerfile.api -t drawio-export .
docker tag drawio-export:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/drawio-export:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/drawio-export:latest

# 3. Create Lambda function from ECR image
# Use AWS Console or CLI
```

### Google Cloud Run

```bash
# 1. Build image
docker build -f Dockerfile.api -t drawio-export .

# 2. Tag image
docker tag drawio-export gcr.io/PROJECT_ID/drawio-export

# 3. Push to Container Registry
docker push gcr.io/PROJECT_ID/drawio-export

# 4. Deploy to Cloud Run
gcloud run deploy drawio-export \
  --image gcr.io/PROJECT_ID/drawio-export \
  --platform managed \
  --region us-central1 \
  --set-env-vars API_KEY=your-secret-key
```

### Azure Container Instances

```bash
# 1. Push to Azure Container Registry
az acr build --registry myregistry --image drawio-export:latest .

# 2. Create container instance
az container create \
  --resource-group myResourceGroup \
  --name drawio-export \
  --image myregistry.azurecr.io/drawio-export:latest \
  --ports 3000 \
  --environment-variables API_KEY=your-secret-key
```

### DigitalOcean App Platform

```bash
# 1. Create app.yaml
cat > app.yaml << 'EOF'
name: drawio-export
services:
- name: api
  github:
    repo: your-username/draw.io-export
    branch: main
  build_command: npm install
  run_command: npm start
  envs:
  - key: API_KEY
    value: your-secret-key
  - key: NODE_ENV
    value: production
  http_port: 3000
EOF

# 2. Deploy
doctl apps create --spec app.yaml
```

## Production Configuration

### Security Best Practices

```env
# .env.production
API_KEY=generate-a-strong-random-key-here
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_UPLOAD_SIZE=52428800
REQUEST_TIMEOUT=30000
```

Generate strong API key:
```bash
# Linux/Mac
openssl rand -hex 32

# Windows PowerShell
[convert]::ToHexString((1..32 | ForEach-Object {Get-Random -Maximum 256}))

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_KEY` | `11223344zzz` | API authentication key |
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |
| `CHROMIUM_PATH` | Auto-detect | Path to Chromium binary |
| `LOG_LEVEL` | `info` | Logging level |

## Reverse Proxy Setup

### Nginx

```nginx
upstream drawio {
    server localhost:3000;
}

server {
    listen 80;
    server_name api.example.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://drawio;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }
}
```

### Apache

```apache
<VirtualHost *:80>
    ServerName api.example.com
    Redirect permanent / https://api.example.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName api.example.com

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/api.example.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/api.example.com/privkey.pem

    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    RequestHeader set X-Forwarded-Proto https
    RequestHeader set X-Forwarded-For %{REMOTE_ADDR}s

    Header set Strict-Transport-Security "max-age=31536000"
</VirtualHost>
```

## Process Manager Setup

### PM2

```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'drawio-export',
      script: './api.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        API_KEY: 'your-secret-key',
        PORT: 3000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
EOF

# Start app
pm2 start ecosystem.config.js

# View logs
pm2 logs drawio-export

# Monitor
pm2 monit

# Stop
pm2 stop drawio-export

# Restart
pm2 restart drawio-export

# Delete
pm2 delete drawio-export
```

### Systemd (Linux)

```bash
# Create service file
sudo tee /etc/systemd/system/drawio-export.service << 'EOF'
[Unit]
Description=Draw.io Export API
After=network.target

[Service]
Type=simple
User=nobody
WorkingDirectory=/opt/drawio-export
Environment="NODE_ENV=production"
Environment="API_KEY=your-secret-key"
Environment="PORT=3000"
ExecStart=/usr/bin/node /opt/drawio-export/api.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl enable drawio-export
sudo systemctl start drawio-export

# Check status
sudo systemctl status drawio-export

# View logs
sudo journalctl -u drawio-export -f
```

## Monitoring & Logging

### Health Checks

```bash
# Basic health check
curl http://localhost:3000/health

# With timeout
curl --max-time 5 http://localhost:3000/health
```

### Logging Setup

```javascript
// logs/setup.js
const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

module.exports = {
  info: (msg) => console.log(`[${new Date().toISOString()}] INFO: ${msg}`),
  error: (msg) => console.error(`[${new Date().toISOString()}] ERROR: ${msg}`),
  warn: (msg) => console.warn(`[${new Date().toISOString()}] WARN: ${msg}`)
};
```

### Monitoring with Prometheus

```javascript
// middleware/metrics.js
const promClient = require('prom-client');

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

module.exports = { httpRequestDuration, httpRequestTotal };
```

## Backup & Recovery

### Database Backup (if storing exports)

```bash
# Backup MongoDB
mongodump --uri mongodb://localhost:27017/drawio-export --out backup/

# Restore MongoDB
mongorestore --uri mongodb://localhost:27017/drawio-export backup/
```

### File Backup

```bash
# Backup logs and cache
tar -czf backup/drawio-export-$(date +%Y%m%d).tar.gz \
  .cache/ logs/ sample-diagram.xml
```

## Performance Tuning

### Node.js Optimization

```bash
# Increase memory
NODE_OPTIONS=--max-old-space-size=4096 npm start

# Enable cluster mode (PM2)
pm2 start api.js -i max

# Use node-gyp for native compilation
npm install --build-from-source
```

### Caching Strategy

```javascript
// Cache exports in memory or Redis
const cache = new Map();

function cacheKey(xml, format, scale, border) {
  return `${hash(xml)}-${format}-${scale}-${border}`;
}

async function getOrExport(xml, format, options) {
  const key = cacheKey(xml, format, options.scale, options.border);
  
  if (cache.has(key)) {
    return cache.get(key);
  }

  const result = await exportDiagram(xml, format, options);
  cache.set(key, result);
  
  return result;
}
```

## Scaling

### Horizontal Scaling

```bash
# Run multiple instances
PORT=3001 npm start
PORT=3002 npm start
PORT=3003 npm start

# Use load balancer (Nginx) to distribute requests
```

### Container Orchestration (Kubernetes)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: drawio-export
spec:
  replicas: 3
  selector:
    matchLabels:
      app: drawio-export
  template:
    metadata:
      labels:
        app: drawio-export
    spec:
      containers:
      - name: api
        image: drawio-export:latest
        ports:
        - containerPort: 3000
        env:
        - name: API_KEY
          valueFrom:
            secretKeyRef:
              name: drawio-secrets
              key: api-key
        - name: NODE_ENV
          value: production
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
```

Deploy:
```bash
kubectl apply -f deployment.yaml
```

## Troubleshooting

### High Memory Usage

```bash
# Check memory
ps aux | grep node

# Enable garbage collection logging
NODE_OPTIONS=--trace-gc npm start

# Reduce cache size or implement TTL
```

### Slow Exports

```bash
# Profile performance
node --prof api.js
node --prof-process isolate-*.log > profile.txt

# Check Chromium performance
ps aux | grep chromium
```

### Connection Issues

```bash
# Check port binding
netstat -tulpn | grep 3000

# Check DNS resolution
nslookup localhost
```

## Security Checklist

- [ ] API key changed from default
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] CORS restrictions set
- [ ] Input validation enabled
- [ ] Logs monitored
- [ ] Updates scheduled
- [ ] Firewall configured
- [ ] Backups automated
- [ ] Monitoring enabled

## Maintenance Schedule

- **Daily**: Check logs for errors
- **Weekly**: Monitor resource usage
- **Monthly**: Update dependencies, review security
- **Quarterly**: Load testing, backup verification
- **Yearly**: Major version upgrades, architecture review

## Support & Documentation

- `/api/docs` - API documentation
- `QUICK_START.md` - Quick start guide
- `API_README.md` - Full API reference
- GitHub Issues - Bug reports and feature requests
