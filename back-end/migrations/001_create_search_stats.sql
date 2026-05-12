
CREATE TABLE IF NOT EXISTS "SearchStats" (
    search_stat_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "Users"(user_id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    category VARCHAR(150),
    source VARCHAR(50) DEFAULT 'unknown',
    results_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE INDEX IF NOT EXISTS idx_searchstats_user_id ON "SearchStats"(user_id);
CREATE INDEX IF NOT EXISTS idx_searchstats_query ON "SearchStats"(query_text);
