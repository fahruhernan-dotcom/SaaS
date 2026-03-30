-- Create table for persistent rate limiting
CREATE TABLE IF NOT EXISTS invite_rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address text NOT NULL UNIQUE,
  attempt_count integer DEFAULT 1,
  first_attempt_at timestamptz DEFAULT now(),
  locked_until timestamptz,
  last_attempt_at timestamptz DEFAULT now()
);

-- Optimize IP searches
CREATE INDEX IF NOT EXISTS idx_invite_rate_limits_ip ON invite_rate_limits(ip_address);

-- Comment for reference
COMMENT ON TABLE invite_rate_limits IS 'Persistent rate limiting for invite code verification.';
