-- 007_add_placeholder_admin.sql
-- Seeds a placeholder admin account (id auto-generated).
-- Login: admin@eduva.com / Admin123!  (change after first login)

BEGIN;

-- ensure pgcrypto is available for bcrypt hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- insert only if the email doesn't already exist
INSERT INTO admins (email, title, password_hash, first_name, last_name)
SELECT
  'admin@eduva.com',
  'Admin',
  crypt('Admin123', gen_salt('bf', 12)), -- bcrypt hash
  'Default',
  'Admin'
WHERE NOT EXISTS (
  SELECT 1 FROM admins WHERE email = 'admin@eduva.com'
);

COMMIT;
