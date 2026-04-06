-- Create Admin User
INSERT INTO users (name, email, password, role, "isGoogleAuth", "sameShippingBillingDefault", "createdAt", "updatedAt")
VALUES (
  'Super Admin',
  'admin@example.com',
  '$2b$10$we5fK.edrVD.VynGX/qpme8icXrPJVB7n8rzR8IM93HvYRynLxHu6',
  'admin',
  false,
  false,
  NOW(),
  NOW()
);

-- Create Regular User
INSERT INTO users (name, email, password, role, "isGoogleAuth", "sameShippingBillingDefault", "createdAt", "updatedAt")
VALUES (
  'John Doe',
  'john@example.com',
  '$2a$10$YOUR_BCRYPT_HASH_HERE',
  'user',
  false,
  false,
  NOW(),
  NOW()
);
