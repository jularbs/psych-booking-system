-- migrate:up
CREATE TABLE
    availability_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
        rule_type TEXT NOT NULL,
        description TEXT,
        day_of_week INTEGER,
        start_time TIME,
        end_time TIME,
        date_start TIMESTAMPTZ,
        date_end TIMESTAMPTZ,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now (),
        updated_at TIMESTAMPTZ DEFAULT now ()
    );

CREATE INDEX idx_availability_rules_user_id ON availability_rules (user_id);

CREATE INDEX idx_availability_rules_rule_type ON availability_rules (rule_type);

CREATE INDEX idx_availability_rules_is_active ON availability_rules (is_active);

-- migrate:down
DROP TABLE availability_rules;