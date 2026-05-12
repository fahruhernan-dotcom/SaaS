-- Add 'manajer' to the allowed roles in profiles table
-- Peternak vertical uses: owner | manajer | staff (=pekerja) | view_only

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'owner',
    'manajer',
    'staff',
    'view_only',
    'sopir',
    'supir',
    'superadmin'
  ));

-- Backfill: anyone currently null gets 'owner' so existing tenants aren't broken
UPDATE profiles SET role = 'owner' WHERE role IS NULL AND user_type != 'superadmin';
