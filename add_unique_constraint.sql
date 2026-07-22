-- Run this in the Supabase SQL editor AFTER running schema.sql.
-- It adds the unique constraint required for the upsert in the API route
-- to correctly deduplicate reviews rather than inserting duplicates.

ALTER TABLE reviews
  ADD CONSTRAINT reviews_unique_review
  UNIQUE (place_id, author_name, review_time);
