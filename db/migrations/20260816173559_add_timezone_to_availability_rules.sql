-- migrate:up
ALTER TABLE availability_rules
ADD COLUMN time_zone TEXT;

UPDATE availability_rules
SET
    time_zone = 'Asia/Manila'
WHERE
    rule_type = 'weekly_window'
    AND time_zone IS NULL;

-- migrate:down
ALTER TABLE availability_rules
DROP COLUMN time_zone;