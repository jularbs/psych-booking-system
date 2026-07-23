-- migrate:up
ALTER TABLE users
ADD COLUMN refresh_token_hash TEXT;

-- migrate:down
ALTER TABLE users
DROP COLUMN IF EXISTS refresh_token_hash;