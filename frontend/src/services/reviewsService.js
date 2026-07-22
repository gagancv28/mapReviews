// =============================================================================
// src/services/reviewsService.js
//
// All Supabase SELECT queries for the Reviews dashboard.
// Centralised here so components never touch the DB client directly.
// =============================================================================

import { supabase } from '../lib/supabaseClient';

/**
 * Fetches reviews from the `reviews` table, ordered newest-first.
 *
 * @param {object}  opts
 * @param {string}  [opts.placeId]   - Filter to a specific Google Place ID.
 * @param {string}  [opts.sentiment] - Filter by sentiment ('positive'|'negative'|'mixed').
 * @param {string}  [opts.urgency]   - Filter by urgency ('Low'|'High').
 * @param {string}  [opts.theme]     - Filter to rows whose themes[] contains this value.
 * @param {number}  [opts.limit]     - Max rows to return (default: 200).
 * @returns {Promise<{ data: Array, error: object|null }>}
 */
export async function fetchReviewsFromDB({
  placeId   = null,
  sentiment = null,
  urgency   = null,
  theme     = null,
  limit     = 200,
} = {}) {
  let query = supabase
    .from('reviews')
    .select('*')
    .order('review_time', { ascending: false })
    .limit(limit);

  // Narrow by place
  if (placeId && placeId.trim()) {
    query = query.eq('place_id', placeId.trim());
  }

  // Narrow by sentiment (case-insensitive – stored with capital first letter)
  if (sentiment) {
    const cap = sentiment.charAt(0).toUpperCase() + sentiment.slice(1).toLowerCase();
    query = query.eq('sentiment', cap);
  }

  // Narrow by urgency
  if (urgency) {
    const cap = urgency.charAt(0).toUpperCase() + urgency.slice(1).toLowerCase();
    query = query.eq('urgency', cap);
  }

  // Array containment — reviews whose themes[] contains the given value
  if (theme) {
    query = query.contains('themes', [theme]);
  }

  const { data, error } = await query;
  return { data: data ?? [], error };
}

/**
 * Fetches ONLY high-urgency reviews (used by UrgencyQueue when operating
 * in "live Supabase" mode, so it always shows the real DB state even if the
 * parent component has a sentiment filter active).
 *
 * @param {string} [placeId] - Optional place_id to scope the query.
 * @returns {Promise<{ data: Array, error: object|null }>}
 */
export async function fetchHighUrgencyReviews(placeId = null) {
  let query = supabase
    .from('reviews')
    .select('id, author_name, rating, review_text, themes, review_time')
    .eq('urgency', 'High')
    .order('review_time', { ascending: false });

  if (placeId && placeId.trim()) {
    query = query.eq('place_id', placeId.trim());
  }

  const { data, error } = await query;
  return { data: data ?? [], error };
}

/**
 * Returns aggregated sentiment counts directly from the database.
 * Useful as a fast consistency check — compares against the local array.
 *
 * @param {string} [placeId]
 * @returns {Promise<{ positive: number, negative: number, mixed: number }>}
 */
export async function fetchSentimentCounts(placeId = null) {
  let query = supabase
    .from('reviews')
    .select('sentiment');

  if (placeId && placeId.trim()) {
    query = query.eq('place_id', placeId.trim());
  }

  const { data, error } = await query;
  if (error || !data) return { positive: 0, negative: 0, mixed: 0 };

  return data.reduce(
    (acc, r) => {
      const s = (r.sentiment ?? 'mixed').toLowerCase();
      if (s in acc) acc[s] += 1;
      return acc;
    },
    { positive: 0, negative: 0, mixed: 0 }
  );
}
