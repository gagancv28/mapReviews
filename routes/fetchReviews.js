// =============================================================================
// routes/fetchReviews.js
//
// POST /api/fetch-reviews
//
// Body (JSON): { "place_id": "ChIJ..." }
//
// Pipeline:
//   1. Fetch reviews  →  getFakeReviews()   (swap for fetchGoogleReviews() later)
//   2. Analyse each review via Gemini AI
//   3. Upsert all enriched reviews into Supabase
//   4. Return the saved reviews as JSON
// =============================================================================

import { Router } from "express";
import { getFakeReviews /*, fetchGoogleReviews */ } from "../services/googleReviews.js";
import { analyzeReviews } from "../services/analyzeReviews.js";
import supabase from "../services/supabaseClient.js";

const router = Router();

// ---------------------------------------------------------------------------
// POST /api/fetch-reviews
// ---------------------------------------------------------------------------
router.post("/", async (req, res) => {
  const { place_id } = req.body;

  if (!place_id || typeof place_id !== "string" || place_id.trim() === "") {
    return res.status(400).json({
      success: false,
      error: "`place_id` is required and must be a non-empty string.",
    });
  }

  const pid = place_id.trim();

  try {
    // ── Step 1: Fetch raw reviews ──────────────────────────────────────────
    // TODO: When you have a Google Maps API key, replace the line below with:
    //   const rawReviews = await fetchGoogleReviews(pid);
    console.log(`[fetchReviews] Fetching reviews for place_id: "${pid}"…`);
    const rawReviews = await getFakeReviews(pid);
    console.log(`[fetchReviews] Got ${rawReviews.length} raw review(s).`);

    // ── Step 2: AI sentiment analysis ─────────────────────────────────────
    console.log("[fetchReviews] Running AI analysis via Gemini…");
    const enrichedReviews = await analyzeReviews(rawReviews);
    console.log("[fetchReviews] Analysis complete.");

    // ── Step 3: Upsert into Supabase ──────────────────────────────────────
    // We use (place_id, author_name, review_time) as a natural unique key.
    // If the same review is fetched again it is updated in place rather than
    // duplicated.  A dedicated unique constraint in Supabase is recommended
    // (see comment below).
    const rows = enrichedReviews.map((r) => ({
      place_id:    r.place_id,
      author_name: r.author_name,
      rating:      r.rating,
      review_text: r.review_text ?? null,
      review_time: r.review_time,
      sentiment:   r.sentiment,
      themes:      r.themes,
      urgency:     r.urgency,
      // created_at is managed by the DB default (NOW())
    }));

    // NOTE: For onConflict upsert to work you need a UNIQUE constraint on
    // (place_id, author_name, review_time) in your Supabase table, e.g.:
    //   ALTER TABLE reviews
    //     ADD CONSTRAINT reviews_unique_review
    //     UNIQUE (place_id, author_name, review_time);
    //
    // Without it, change ignoreDuplicates to false and omit onConflict to
    // do a plain INSERT instead.
    const { data: savedRows, error: dbError } = await supabase
      .from("reviews")
      .upsert(rows, {
        onConflict:       "place_id, author_name, review_time",
        ignoreDuplicates: false,
      })
      .select();

    if (dbError) {
      console.error("[fetchReviews] Supabase upsert error:", dbError);
      return res.status(500).json({
        success: false,
        error:   "Database upsert failed.",
        details: dbError.message,
      });
    }

    console.log(`[fetchReviews] Upserted ${savedRows?.length ?? 0} row(s) to Supabase.`);

    // ── Step 4: Respond ───────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      message: `Fetched, analysed, and saved ${savedRows?.length ?? 0} review(s).`,
      data:    savedRows,
    });
  } catch (err) {
    console.error("[fetchReviews] Unexpected error:", err);
    return res.status(500).json({
      success: false,
      error:   "An unexpected server error occurred.",
      details: err.message,
    });
  }
});

export default router;
