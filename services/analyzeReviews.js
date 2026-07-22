// =============================================================================
// analyzeReview.js
// Sends a single review to Gemini and parses back structured analysis:
//   - sentiment  : "Positive" | "Negative" | "Mixed"
//   - themes     : string[]  (e.g. ["Food Quality", "Service", "Hygiene"])
//   - urgency    : "Low" | "High"
// =============================================================================

import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

/**
 * Builds the structured prompt sent to Gemini for a single review.
 *
 * @param {object} review - The raw review object.
 * @returns {string} The prompt string.
 */
function buildPrompt(review) {
  return `
You are a review analysis assistant for a restaurant / food business.

Analyse the following customer review and respond with ONLY a valid JSON object
— no markdown fences, no extra text, just raw JSON.

The JSON must have exactly these keys:
  "sentiment" : one of "Positive", "Negative", or "Mixed"
  "themes"    : an array of relevant theme strings chosen from this list:
                ["Food Quality", "Service", "Ambiance", "Hygiene", "Value for Money",
                 "Wait Time", "Staff Behaviour", "Packaging", "Portion Size", "Other"]
  "urgency"   : "High" if the review mentions safety/health issues, very rude staff,
                or a situation that could damage the business reputation immediately;
                otherwise "Low"

Review details:
  Author : ${review.author_name}
  Rating : ${review.rating} / 5
  Text   : "${review.review_text}"

Respond with only the JSON object.
`.trim();
}

// ---------------------------------------------------------------------------
// Analyser
// ---------------------------------------------------------------------------

/**
 * Analyses a single review using Gemini and returns the enriched review object.
 *
 * @param {object} review - Raw review from the reviews source.
 * @returns {Promise<object>} The review enriched with sentiment, themes, urgency.
 */
export async function analyzeReview(review) {
  const prompt = buildPrompt(review);

  let rawText = "";
  try {
    const result = await model.generateContent(prompt);
    rawText = result.response.text().trim();

    // Strip accidental markdown code fences if the model adds them
    rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

    const analysis = JSON.parse(rawText);

    // Validate expected fields — fall back to safe defaults if missing
    const sentiment = ["Positive", "Negative", "Mixed"].includes(analysis.sentiment)
      ? analysis.sentiment
      : "Mixed";

    const themes = Array.isArray(analysis.themes) ? analysis.themes : [];

    const urgency = ["Low", "High"].includes(analysis.urgency)
      ? analysis.urgency
      : "Low";

    return {
      ...review,
      sentiment,
      themes,
      urgency,
    };
  } catch (err) {
    console.error(
      `[analyzeReview] Failed to parse Gemini response for "${review.author_name}".`,
      "\nRaw response:", rawText,
      "\nError:", err.message
    );

    // Return the review with neutral fallback values rather than crashing the whole batch
    return {
      ...review,
      sentiment: "Mixed",
      themes: [],
      urgency: "Low",
    };
  }
}

// ---------------------------------------------------------------------------
// Batch analyser
// ---------------------------------------------------------------------------

/**
 * Analyses an array of reviews sequentially (to respect API rate limits).
 *
 * @param {Array<object>} reviews - Array of raw review objects.
 * @returns {Promise<Array<object>>} Array of enriched review objects.
 */
export async function analyzeReviews(reviews) {
  const results = [];

  for (const review of reviews) {
    console.log(`[analyzeReview] Analysing review by "${review.author_name}"…`);
    const enriched = await analyzeReview(review);
    results.push(enriched);
  }

  return results;
}
