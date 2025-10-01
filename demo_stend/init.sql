-- Initialize database schema
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    payload TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_items_id ON items(id);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at);

-- Insert some test data
INSERT INTO items (payload, created_at) VALUES
    ('Initial test data 1', NOW() - INTERVAL '1 hour'),
    ('Initial test data 2', NOW() - INTERVAL '30 minutes'),
    ('Initial test data 3', NOW() - INTERVAL '10 minutes');
