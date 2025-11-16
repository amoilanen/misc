# Elysium Blockchain Deployment Guide

This guide covers deploying Elysium blockchain nodes in production environments.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Building for Production](#building-for-production)
3. [Node Deployment](#node-deployment)
4. [RPC Server Deployment](#rpc-server-deployment)
5. [Network Configuration](#network-configuration)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Security Considerations](#security-considerations)

## System Requirements

### Minimum Requirements

- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 50 GB SSD
- **Network**: 10 Mbps upload/download

### Recommended Requirements

- **CPU**: 4+ cores
- **RAM**: 8+ GB
- **Storage**: 200+ GB SSD
- **Network**: 100 Mbps upload/download

### Operating System

- Linux (Ubuntu 20.04+, Debian 11+, or similar)
- macOS (for development)
- Windows (for development, not recommended for production)

## Building for Production

### 1. Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustup default stable
```

### 2. Build Release Binaries

```bash
# Clone repository
git clone <repository-url>
cd elysium

# Build optimized release binaries
cargo build --release

# Binaries will be in target/release/
# - elysium-node
# - elysium-client
```

### 3. Create Systemd Service Files

Create `/etc/systemd/system/elysium-node.service`:

```ini
[Unit]
Description=Elysium Blockchain Node
After=network.target

[Service]
Type=simple
User=elysium
Group=elysium
WorkingDirectory=/opt/elysium
ExecStart=/opt/elysium/elysium-node \
    --listen 0.0.0.0:8080 \
    --difficulty 2 \
    --mine \
    --mining-interval 10
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Create `/etc/systemd/system/elysium-client.service`:

```ini
[Unit]
Description=Elysium RPC Server
After=network.target elysium-node.service
Requires=elysium-node.service

[Service]
Type=simple
User=elysium
Group=elysium
WorkingDirectory=/opt/elysium
ExecStart=/opt/elysium/elysium-client \
    --rpc-addr 0.0.0.0:8545 \
    --difficulty 2
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

## Node Deployment

### Step 1: Create User and Directories

```bash
# Create system user
sudo useradd -r -s /bin/false -d /opt/elysium elysium

# Create directories
sudo mkdir -p /opt/elysium
sudo mkdir -p /var/lib/elysium
sudo chown -R elysium:elysium /opt/elysium
sudo chown -R elysium:elysium /var/lib/elysium
```

### Step 2: Copy Binaries

```bash
# Copy binaries
sudo cp target/release/elysium-node /opt/elysium/
sudo cp target/release/elysium-client /opt/elysium/
sudo chmod +x /opt/elysium/elysium-node
sudo chmod +x /opt/elysium/elysium-client
sudo chown elysium:elysium /opt/elysium/*
```

### Step 3: Configure Firewall

```bash
# Allow node port (default 8080)
sudo ufw allow 8080/tcp

# Allow RPC port (default 8545)
sudo ufw allow 8545/tcp

# Enable firewall
sudo ufw enable
```

### Step 4: Start Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable elysium-node
sudo systemctl enable elysium-client

# Start services
sudo systemctl start elysium-node
sudo systemctl start elysium-client

# Check status
sudo systemctl status elysium-node
sudo systemctl status elysium-client
```

### Step 5: View Logs

```bash
# View node logs
sudo journalctl -u elysium-node -f

# View RPC server logs
sudo journalctl -u elysium-client -f
```

## RPC Server Deployment

### Standalone RPC Server

If running RPC server separately from the node:

```bash
# Start RPC server
cargo run --bin elysium-client --release -- \
    --rpc-addr 0.0.0.0:8545 \
    --node-addr 127.0.0.1:8080 \
    --difficulty 2
```

### Behind Reverse Proxy (Nginx)

Create `/etc/nginx/sites-available/elysium-rpc`:

```nginx
server {
    listen 80;
    server_name rpc.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8545;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/elysium-rpc /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL/TLS with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d rpc.yourdomain.com

# Auto-renewal is set up automatically
```

## Network Configuration

### Connecting Multiple Nodes

#### Node 1 (Bootstrap Node)

```bash
cargo run --bin elysium-node --release -- \
    --listen 0.0.0.0:8080 \
    --difficulty 2 \
    --mine \
    --mining-interval 10
```

#### Node 2 (Connect to Node 1)

```bash
cargo run --bin elysium-node --release -- \
    --listen 0.0.0.0:8081 \
    --difficulty 2 \
    --peers 192.168.1.100:8080
```

#### Node 3 (Connect to both)

```bash
cargo run --bin elysium-node --release -- \
    --listen 0.0.0.0:8082 \
    --difficulty 2 \
    --peers 192.168.1.100:8080,192.168.1.101:8081
```

### Network Topology Recommendations

- **Small Network (2-5 nodes)**: Full mesh (each node connects to all others)
- **Medium Network (5-20 nodes)**: Hub and spoke (bootstrap nodes, others connect to hubs)
- **Large Network (20+ nodes)**: Hierarchical (multiple bootstrap nodes, regional clusters)

## Monitoring and Maintenance

### Health Checks

Create a simple health check script `/opt/elysium/health-check.sh`:

```bash
#!/bin/bash
# Check if RPC server is responding
response=$(curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"elysium_getHeight","params":[],"id":1}')

if echo "$response" | grep -q "result"; then
    echo "Node is healthy"
    exit 0
else
    echo "Node is unhealthy"
    exit 1
fi
```

Make executable:

```bash
sudo chmod +x /opt/elysium/health-check.sh
```

### Monitoring with Prometheus

[Add Prometheus exporter implementation if needed]

### Log Rotation

Create `/etc/logrotate.d/elysium`:

```
/var/log/elysium/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 elysium elysium
    sharedscripts
}
```

### Backup Strategy

```bash
# Backup blockchain data
sudo tar -czf /backup/elysium-$(date +%Y%m%d).tar.gz /var/lib/elysium/

# Restore from backup
sudo systemctl stop elysium-node
sudo tar -xzf /backup/elysium-YYYYMMDD.tar.gz -C /
sudo systemctl start elysium-node
```

## Security Considerations

### 1. Firewall Configuration

- Only expose necessary ports (8080 for nodes, 8545 for RPC)
- Use firewall rules to restrict access to known IPs if possible
- Consider using VPN for node-to-node communication

### 2. RPC Security

- **Never expose RPC server to public internet without authentication**
- Use reverse proxy with authentication
- Implement rate limiting
- Use HTTPS/TLS for all RPC connections

### 3. Key Management

- Store private keys securely (use hardware wallets for production)
- Never commit private keys to version control
- Use environment variables or secure key management systems

### 4. System Hardening

```bash
# Disable unnecessary services
sudo systemctl disable <unnecessary-service>

# Keep system updated
sudo apt update && sudo apt upgrade -y

# Install fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### 5. Resource Limits

Add to systemd service files:

```ini
[Service]
LimitNOFILE=65536
LimitNPROC=4096
```

## Troubleshooting

### Node Won't Start

1. Check logs: `sudo journalctl -u elysium-node -n 50`
2. Verify port is not in use: `sudo netstat -tulpn | grep 8080`
3. Check permissions: `ls -la /opt/elysium`

### RPC Server Not Responding

1. Check if node is running: `sudo systemctl status elysium-node`
2. Test RPC locally: `curl http://localhost:8545`
3. Check firewall: `sudo ufw status`

### High CPU Usage

- Reduce mining difficulty
- Increase mining interval
- Check for network issues causing excessive reconnections

### Disk Space Issues

- Implement log rotation
- Archive old blockchain data
- Monitor disk usage: `df -h`

## Production Checklist

- [ ] Binaries built in release mode
- [ ] Systemd services configured
- [ ] Firewall rules configured
- [ ] Logging configured
- [ ] Backup strategy in place
- [ ] Monitoring set up
- [ ] Security hardening applied
- [ ] SSL/TLS configured for RPC
- [ ] Health checks implemented
- [ ] Documentation updated with node addresses

## Support

For issues and questions:
- Check logs: `sudo journalctl -u elysium-node`
- Review documentation
- Open an issue on GitHub

