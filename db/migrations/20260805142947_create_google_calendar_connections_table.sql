-- migrate:up
CREATE TABLE
    google_calendar_connections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        google_email TEXT NOT NULL,
        provider_subject TEXT NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        token_expiry TIMESTAMPTZ NOT NULL,
        scope TEXT,
        calendar_id TEXT,
        calendar_summary TEXT,
        sync_token TEXT,
        watch_channel_id TEXT,
        watch_resource_id TEXT,
        watch_expiration TIMESTAMPTZ,
        status TEXT NOT NULL DEFAULT 'active',
        last_synced_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now ()
    );

CREATE UNIQUE INDEX idx_google_calendar_connections_user_id ON google_calendar_connections (user_id);

CREATE UNIQUE INDEX idx_google_calendar_connections_provider_subject ON google_calendar_connections (provider_subject);

CREATE INDEX idx_google_calendar_connections_status ON google_calendar_connections (status);

CREATE INDEX idx_google_calendar_connections_calendar_id ON google_calendar_connections (calendar_id);

-- migrate:down
DROP TABLE IF EXISTS google_calendar_connections;