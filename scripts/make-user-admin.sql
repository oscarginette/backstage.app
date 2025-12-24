-- Make a user an admin
-- Usage: Run this with the email of the user you want to make admin

UPDATE users
SET role = 'admin', updated_at = NOW()
WHERE email = 'admin@backstage-art.com';

-- Verify the update
SELECT id, email, role, active, created_at
FROM users
WHERE email = 'admin@backstage-art.com';
