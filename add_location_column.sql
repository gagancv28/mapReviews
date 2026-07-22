-- ============================================================
-- Migration: Add `location` column to reviews table
-- Run this in Supabase SQL Editor to enable location filtering
-- ============================================================

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS location TEXT DEFAULT NULL;

-- Index for fast location queries
CREATE INDEX IF NOT EXISTS idx_reviews_location
    ON reviews (location);

-- Back-fill: tag all existing rows as 'Udupi' if that is the
-- current clinic. Replace 'Udupi' with the correct value if
-- you have multiple locations.
UPDATE reviews
  SET location = 'Udupi'
  WHERE location IS NULL;
