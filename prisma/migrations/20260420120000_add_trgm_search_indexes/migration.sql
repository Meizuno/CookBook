-- Enable trigram extension for fast ILIKE '%…%' searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram indexes accelerate case-insensitive substring matches
-- on title and content used by GET /api/recipes?search=…
CREATE INDEX "recipes_title_trgm_idx"   ON "recipes" USING GIN ("title"   gin_trgm_ops);
CREATE INDEX "recipes_content_trgm_idx" ON "recipes" USING GIN ("content" gin_trgm_ops);
