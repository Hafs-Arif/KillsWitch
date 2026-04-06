# Database Migration Guide

## Overview
This guide explains how to properly run all database migrations for the KillsWitch backend.

## Prerequisites

### 1. Environment Configuration
Make sure your `.env` file has the correct database credentials:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_actual_postgres_password
DB_NAME=killswitch_db
DB_DIALECT=postgres
NODE_ENV=development
```

**IMPORTANT**: Update `DB_PASSWORD` with your actual PostgreSQL password. The default in `config/database.js` is `postgree@umer`, but if you're using a different password, set it in the `.env` file.

### 2. PostgreSQL Setup
Ensure PostgreSQL is:
- Running and accessible
- Has a user `postgres` with the password you specified
- The database `killswitch_db` can be created (or already exists)

## Migration Files

Total migrations: **33 files** (after cleanup)

### Migration Structure
- **20260101000001-00020**: Core table creation migrations (users, products, orders, etc.)
- **20260101000021-00033**: Alteration and additional field migrations

## Running Migrations

### Option 1: Run All Migrations (Recommended)

```bash
# First, clean up any duplicate files
node cleanup-migrations.js

# Then run all migrations
node run-all-migrations.js
```

### Option 2: Run Migrations Using Sequelize CLI (Preferred)

```bash
# Install sequelize-cli if not installed
npm install --save-dev sequelize-cli

# Verify .sequelizerc exists in root directory (it should)

# Run migrations with explicit environment
NODE_ENV=development npx sequelize-cli db:migrate

# Or for production
NODE_ENV=production npx sequelize-cli db:migrate
```

### Option 3: Quick Setup and Migration

```bash
# 1. Configure database credentials
node setup-auth.js

# 2. Test database connection
node test-db-connection.js

# 3. Run migrations
NODE_ENV=development npx sequelize-cli db:migrate
```

## Troubleshooting

### Error: "password authentication failed for user 'postgres'"

**Causes:**
1. `.env` file not found or missing `DB_PASSWORD`
2. Incorrect password in `.env`
3. PostgreSQL user doesn't exist or is locked

**Solution:**
```bash
# Step 1: Create/update .env file with correct credentials
node setup-auth.js

# Step 2: Verify PostgreSQL is running and accessible
psql -U postgres -h localhost

# Step 3: Test database connection
node test-db-connection.js

# Step 4: If password is wrong, reset it in PostgreSQL
sudo -u postgres psql
ALTER USER postgres WITH PASSWORD 'your_new_password';
\q

# Step 5: Update .env with the new password and try again
```

### Error: "database does not exist"

**Solution:**
Sequelize CLI will create the database automatically during migration. If it doesn't:

```bash
# Create the database manually
createdb -U postgres -h localhost ecommerce

# Or if using a different database name from .env
createdb -U postgres -h localhost $DB_NAME
```

### Sequelize CLI shows: "ERROR: password authentication failed"

**This usually means:**
1. `.env` file is not being read by Sequelize CLI
2. Environment variables are not being passed to the process

**Solution:**
```bash
# Explicitly load environment and run migrations
NODE_ENV=development npx sequelize-cli db:migrate

# Or set individual variables
DB_USER=postgres DB_PASSWORD=pakistan2025 DB_NAME=ecommerce \
  npx sequelize-cli db:migrate
```

### Duplicate Migration Files

**Solution:**
Run the cleanup script to remove old migration files:
```bash
node cleanup-migrations.js
```

### Cannot find module .sequelizerc

**Solution:**
The `.sequelizerc` file should exist in the project root. If missing:
```bash
# It should already exist, but if not create it
npx sequelize-cli init
```

## Migration Summary

### Created Tables
- ✅ users
- ✅ passwordResets
- ✅ categories
- ✅ brands
- ✅ subcategories
- ✅ brandcategories
- ✅ products
- ✅ productimages
- ✅ shipments
- ✅ payments
- ✅ orders
- ✅ order_items
- ✅ contacts
- ✅ newsletters
- ✅ activity_logs
- ✅ adminrequests
- ✅ quotes
- ✅ chat_messages
- ✅ cookie_consents
- ✅ coupons
- ✅ carts
- ✅ cart_items
- ✅ sessions
- ✅ addresses
- ✅ reviews

### Alterations Applied
- Added coupon fields to orders
- Added message deduplication fields
- Added offline message fields
- Added product specifications and images
- Added same shipping/billing preference
- Added slug, sale_price, and video to products
- Added financial fields to orders
- Removed title field from reviews

## Verify Migrations

After running migrations, verify they completed successfully:

```bash
# Using psql
psql -U postgres -d killswitch_db -c "\dt"

# Or use the verification script (if available)
node verify-migrations.js
```

## Rollback (if needed)

⚠️ **Caution**: This will destroy your database schema

```bash
# Using Sequelize CLI
npx sequelize-cli db:migrate:undo:all
```

Or manually in psql:
```sql
DROP DATABASE killswitch_db;
CREATE DATABASE killswitch_db;
```

## Next Steps

After migrations complete:
1. Seed the database (if seed scripts exist)
2. Start the server: `npm start`
3. Verify API endpoints are working

## Support

If migrations fail:
1. Check the error message carefully
2. Review the relevant migration file in `/migrations`
3. Check database logs: `sudo tail -f /var/log/postgresql/postgresql.log`
4. Ensure all dependencies are installed: `npm install`
