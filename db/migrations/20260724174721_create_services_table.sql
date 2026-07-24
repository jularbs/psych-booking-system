-- migrate:up
CREATE TABLE
    services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        duration_minutes INT NOT NULL,
        price_amount DECIMAL(10, 2) NOT NULL,
        currency TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

CREATE INDEX idx_services_slug ON services (slug);

CREATE INDEX idx_services_is_active ON services (is_active);

-- migrate:down
DROP TABLE IF EXISTS services;