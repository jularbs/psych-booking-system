-- migrate:up
CREATE TABLE
    bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        service_id UUID NOT NULL REFERENCES services (id) ON DELETE RESTRICT,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        starts_at TIMESTAMPTZ NOT NULL,
        ends_at TIMESTAMPTZ NOT NULL,
        time_zone TEXT NOT NULL,
        status TEXT NOT NULL,
        google_calendar_event_id TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now ()
    );

CREATE INDEX idx_bookings_user_id ON bookings (user_id);

CREATE INDEX idx_bookings_service_id ON bookings (service_id);

CREATE INDEX idx_bookings_starts_at ON bookings (starts_at);

CREATE INDEX idx_bookings_status ON bookings (status);

-- migrate:down
DROP TABLE IF EXISTS bookings;