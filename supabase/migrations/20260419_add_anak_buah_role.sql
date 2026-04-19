-- Add 'anak_buah' to allowed roles
-- Anak Buah Kandang: physical farm worker, can only view & complete assigned tasks

ALTER TABLE profiles
  DROP CONSTRAINT profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role = ANY (ARRAY[
    'owner',
    'staff',
    'superadmin',
    'view_only',
    'sopir',
    'anak_buah'
  ]));
