-- migrate:up
ALTER TABLE google_calendar_connections
ALTER COLUMN access_token
DROP NOT NULL,
ALTER COLUMN refresh_token
DROP NOT NULL,
ALTER COLUMN token_expiry
DROP NOT NULL,
ALTER COLUMN status
SET DEFAULT 'pending';

-- migrate:down
UPDATE google_calendar_connections
SET
    access_token = COALESCE(access_token, ''),
    refresh_token = COALESCE(refresh_token, ''),
    token_expiry = COALESCE(token_expiry, now ());

ALTER TABLE google_calendar_connections
ALTER COLUMN access_token
SET
    NOT NULL,
ALTER COLUMN refresh_token
SET
    NOT NULL,
ALTER COLUMN token_expiry
SET
    NOT NULL,
ALTER COLUMN status
SET DEFAULT 'active';