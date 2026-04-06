#!/bin/bash

echo "🚀 PostgreSQL Startup Helper"
echo "=============================="
echo ""

# Check if running as root/sudo
if [ "$EUID" -ne 0 ]; then 
   echo "❌ This script must be run as root (use sudo)"
   exit 1
fi

echo "1️⃣  Stopping any existing PostgreSQL services..."
systemctl stop postgresql
sleep 2

echo ""
echo "2️⃣  Checking PostgreSQL cluster status..."
sudo -u postgres pg_lsclusters

echo ""
echo "3️⃣  Starting PostgreSQL..."
systemctl start postgresql
sleep 3

echo ""
echo "4️⃣  Verifying PostgreSQL is running..."
systemctl status postgresql --no-pager

echo ""
echo "5️⃣  Testing database connection..."
sudo -u postgres psql -h localhost -U postgres -d postgres -c "SELECT version();"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ PostgreSQL is running successfully!"
    echo ""
    echo "6️⃣  You can now run migrations:"
    echo "    node run-all-migrations.js"
else
    echo ""
    echo "❌ PostgreSQL connection failed. Check logs with:"
    echo "    sudo journalctl -xe -u postgresql | tail -50"
fi
