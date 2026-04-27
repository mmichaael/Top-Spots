CREATE TABLE IF NOT EXISTS places (
    place_id TEXT PRIMARY KEY,
    query_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    photo_url TEXT,
    rating NUMERIC(3,1),
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    types TEXT[],
    save_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_places_query_name ON places(query_name);
CREATE INDEX IF NOT EXISTS idx_places_full_name ON places(full_name);
CREATE INDEX IF NOT EXISTS idx_places_types ON places USING GIN(types);
CREATE INDEX IF NOT EXISTS idx_places_rating ON places(rating DESC);