-- Check if user exists
SELECT id, name, email, role FROM users WHERE email = 'hafsarif99@gmail.com';

-- View all users
SELECT id, name, email, role FROM users;

-- Count total users
SELECT COUNT(*) FROM users;

-- Find user by partial email
SELECT id, name, email, role FROM users WHERE email LIKE '%hafsarif%';

-- If user exists, update role
UPDATE users SET role = 'admin' WHERE email = 'hafsarif99@gmail.com';
SELECT 'User role updated' AS status;
