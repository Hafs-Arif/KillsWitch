-- Check current database
SELECT current_database() AS current_db;

-- List all databases
SELECT datname FROM pg_database WHERE datistemplate = false;

-- Check current user
SELECT current_user;

-- List all tables in current database
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check if users table exists and row count
SELECT COUNT(*) as user_count FROM users;

-- Show table structure
\d users

-- Get all schemas
SELECT schema_name FROM information_schema.schemata;
