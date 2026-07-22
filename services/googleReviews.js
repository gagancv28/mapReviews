// =============================================================================
// googleReviews.js
// Responsible for supplying raw reviews to the pipeline.
//
// CURRENT MODE  → returns FAKE reviews so the pipeline can be developed and
//                 tested without a Google Maps API key.
//
// FUTURE MODE   → uncomment fetchGoogleReviews() and call it instead of
//                 getFakeReviews().  Set GOOGLE_MAPS_API_KEY in your .env.
// =============================================================================

// ---------------------------------------------------------------------------
// REAL implementation (commented out — plug in your API key to activate)
// ---------------------------------------------------------------------------
//
// import fetch from "node-fetch"; // npm i node-fetch  (or use Node 18 built-in)
//
// /**
//  * Fetches reviews for a given Place ID from the Google Maps Places API.
//  *
//  * @param {string} placeId - The Google Maps Place ID of the business.
//  * @returns {Promise<Array>} Array of raw review objects from the API.
//  */
// export async function fetchGoogleReviews(placeId) {
//   const apiKey = process.env.GOOGLE_MAPS_API_KEY;
//   if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEY is not set.");
//
//   const url =
//     `https://maps.googleapis.com/maps/api/place/details/json` +
//     `?place_id=${placeId}` +
//     `&fields=reviews` +
//     `&key=${apiKey}`;
//
//   const res  = await fetch(url);
//   const data = await res.json();
//
//   if (data.status !== "OK") {
//     throw new Error(`Google Places API error: ${data.status} — ${data.error_message}`);
//   }
//
//   // Normalise to the shape expected by the rest of the pipeline
//   return (data.result.reviews ?? []).map((r) => ({
//     place_id:    placeId,
//     author_name: r.author_name,
//     rating:      r.rating,
//     review_text: r.text,
//     review_time: new Date(r.time * 1000).toISOString(),
//   }));
// }

// ---------------------------------------------------------------------------
// FAKE implementation (active while no API key is available)
// ---------------------------------------------------------------------------

/**
 * Returns a hard-coded set of realistic fake reviews for development/testing.
 * Each review already has the same shape that fetchGoogleReviews() will return,
 * so the rest of the pipeline requires zero changes when you switch.
 *
 * @param {string} placeId - Passed through so downstream code is identical.
 * @returns {Promise<Array>} Array of fake review objects.
 */
export async function getFakeReviews(placeId) {
  // Simulate a small network delay, just like a real API call
  await new Promise((resolve) => setTimeout(resolve, 120));

  return [
    {
      place_id: placeId,
      author_name: "Priya Sharma",
      rating: 5,
      review_text:
        "Absolutely love this place! The butter chicken is the best I've had in the city — " +
        "rich, creamy, and perfectly spiced. The staff remembered my name on my second visit. " +
        "Will definitely be coming back every week!",
      review_time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      place_id: placeId,
      author_name: "Rohan Mehta",
      rating: 2,
      review_text:
        "Very disappointed. Waited 45 minutes for our food and the waiter never came to check on us. " +
        "When the biryani finally arrived it was lukewarm and missing the raita we paid extra for. " +
        "The manager didn't even apologise when we raised the issue.",
      review_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      place_id: placeId,
      author_name: "Anjali Verma",
      rating: 4,
      review_text:
        "Great ambiance and the starters — especially the paneer tikka — were fantastic. " +
        "Main course was a bit slow to arrive on a busy Saturday evening, but the food quality " +
        "made up for it. The mango lassi is a must-try!",
      review_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      place_id: placeId,
      author_name: "Vikram Nair",
      rating: 1,
      review_text:
        "Cockroach spotted near our table. I immediately called the staff and they simply " +
        "moved us to another table with no apology or discount. The food was also heavily " +
        "salted and the naan was burnt. Health authorities should inspect this place urgently.",
      review_time: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      place_id: placeId,
      author_name: "Meera Iyer",
      rating: 3,
      review_text:
        "Average experience overall. The dal makhani was good but the service was inconsistent — " +
        "our drinks arrived after the main course. Decor is nice and the location is convenient. " +
        "Would try it again if they sort out the service issues.",
      review_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}
