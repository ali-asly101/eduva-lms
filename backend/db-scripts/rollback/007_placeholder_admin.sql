-- 007_add_placeholder_admin.down.sql
-- Removes the seeded placeholder admin.

BEGIN;

DELETE FROM admins
WHERE email = 'admin@eduva.com';

COMMIT;
