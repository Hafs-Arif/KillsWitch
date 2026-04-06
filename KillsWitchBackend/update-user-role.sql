-- Update user role to admin
UPDATE users
SET role = 'admin'
WHERE email = 'hafsarif99@gmail.com';

-- Update user role to regular user
UPDATE users
SET role = 'user'
WHERE email = 'admin@example.com';

-- Update user role by ID
UPDATE users
SET role = 'admin'
WHERE id = 1;

-- Update multiple users to admin
UPDATE users
SET role = 'admin'
WHERE email IN ('user1@example.com', 'user2@example.com');
