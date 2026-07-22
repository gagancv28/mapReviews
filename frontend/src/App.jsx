/**
 * App.jsx — Analytics Command Center
 *
 * Data flow (NEW):
 *   1. On mount → auto-load all reviews from Supabase (SELECT *)
 *   2. Optionally filter by Place ID via the search bar
 *   3. All chart interactions filter the CLIENT-SIDE array — no round-trips for filters
 *   4. "Analyse New Reviews" button still calls the Express backend to run
 *      Gemini AI + upsert, then re-queries Supabase so the dashboard updates
 *
 * Filter state:
 *   'all'               → show every row
 *   'positive'          → sentiment = Positive
 *   'negative'          → sentiment = Negative
 *   'mixed'             → sentiment = Mixed
 *   'theme:<ThemeName>' → themes array contains ThemeName
 */

import { useState, useEffect, useCallback } from 'react';
import './App.css';

import { fetchReviewsFromDB } from './services/reviewsService';

import MetricsDashboard   from './components/MetricsDashboard';
import SentimentPieChart from './components/SentimentPieChart';
import SentimentChart    from './components/SentimentChart';
import ThemeBreakdown    from './components/ThemeBreakdown';
import UrgencyQueue      from './components/UrgencyQueue';
import NetSentimentScore from './components/NetSentimentScore';
import ReviewCard        from './components/ReviewCard';
import UserReviewDashboard    from './components/UserReviewDashboard';
import UdupiClinicDashboard   from './components/UdupiClinicDashboard';
import CommandCenterDashboard from './components/CommandCenterDashboard';

// ─── constants ────────────────────────────────────────────────────────────────
const DEFAULT_PLACE_ID = '';   // empty = load ALL reviews from the table

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  // ── View toggle ───────────────────────────────────────────
  const [view, setView] = useState('command'); // 'command' | 'board'
  // ── UI state ─────────────────────────────────────────────────────────────
  const [placeId,      setPlaceId]      = useState(DEFAULT_PLACE_ID);
  const [reviews,      setReviews]      = useState([]);
  const [dbLoading,    setDbLoading]    = useState(false);   // Supabase SELECT
  const [aiLoading,    setAiLoading]    = useState(false);   // backend AI call
  const [error,        setError]        = useState(null);
  const [hasFetched,   setHasFetched]   = useState(false);
  const [lastRefresh,  setLastRefresh]  = useState(null);

  // ── Interactive filter ────────────────────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState('all');

  // ── Derived: filtered reviews (100% client-side) ──────────────────────────
  const filteredReviews = reviews.filter((r) => {
    if (activeFilter === 'all') return true;
    if (activeFilter.startsWith('theme:')) {
      const theme = activeFilter.replace('theme:', '');
      return (r.themes ?? []).includes(theme);
    }
    return r.sentiment?.toLowerCase() === activeFilter;
  });

  // ── Helper: human-readable label for the active filter ───────────────────
  const filterLabel = (() => {
    if (activeFilter === 'all') return null;
    if (activeFilter.startsWith('theme:')) return `Theme: ${activeFilter.replace('theme:', '')}`;
    return activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1);
  })();

  // ── Theme-badge click (from ReviewCard) ──────────────────────────────────
  function handleThemeClick(theme) {
    const key = `theme:${theme}`;
    setActiveFilter((prev) => (prev === key ? 'all' : key));
  }

  // ═════════════════════════════════════════════════════════════════════════
  // LOAD FROM SUPABASE  (direct SELECT query)
  // ═════════════════════════════════════════════════════════════════════════
  const loadFromSupabase = useCallback(async (pid = placeId) => {
    setDbLoading(true);
    setError(null);
    setActiveFilter('all');

    const { data, error: dbErr } = await fetchReviewsFromDB({
      placeId: pid || null,   // null = no filter → fetch all rows
    });

    if (dbErr) {
      setError(`Supabase error: ${dbErr.message}`);
    } else {
      setReviews(data);
      setHasFetched(true);
      setLastRefresh(new Date());
    }

    setDbLoading(false);
  }, [placeId]);

  // Auto-load all reviews on first mount
  useEffect(() => {
    loadFromSupabase('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Form submit → filter by place_id ────────────────────────────────────
  function handleSearch(e) {
    e.preventDefault();
    loadFromSupabase(placeId);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // ANALYSE NEW REVIEWS  (backend → Gemini AI → Supabase upsert → re-query)
  // ═════════════════════════════════════════════════════════════════════════
  async function handleAnalyse() {
    if (!placeId.trim()) {
      setError('Enter a Google Place ID to run AI analysis.');
      return;
    }

    setAiLoading(true);
    setError(null);

    try {
      const res  = await fetch('/api/fetch-reviews', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ place_id: placeId.trim() }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? `Backend error ${res.status}`);
      }

      // Re-query Supabase so the dashboard reflects the freshly upserted rows
      await loadFromSupabase(placeId);
    } catch (err) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  }

  const isLoading = dbLoading || aiLoading;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">

      {/* ═══ NAVBAR ═══ */}
      <nav className="navbar">
        <div className="navbar-inner">
          <a href="/" className="nav-brand">
            <div className="nav-logo-icon">🌿</div>
            <div className="nav-brand-text">
              <span className="nav-brand-name">Guduchi Reviews</span>
              <span className="nav-brand-sub">AI Command Center</span>
            </div>
          </a>

          <div className="nav-right" style={{ gap: '16px' }}>
            {/* View switcher tabs */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: '#f5ebd9', borderRadius: 10, padding: '3px',
            }}>
              {[
                ['command', 'Command Center'],
                ['board', 'Review Board'],
                ['udupi', 'Udupi Clinic']
              ].map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    padding: '6px 16px', borderRadius: 8, border: 'none',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: view === v ? '#b88746' : 'transparent',
                    color:      view === v ? '#fff'    : '#7a5540',
                    transition: 'all .2s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {/* Right side is completely empty */}
          </div>
        </div>
      </nav>

      {/* ═══ REVIEW BOARD (Morning Mist) ═══ */}
      {view === 'board' && <UserReviewDashboard />}

      {/* ═══ UDUPI CLINIC DASHBOARD ═══ */}
      {view === 'udupi' && <UdupiClinicDashboard />}


      {/* ═══ COMMAND CENTER (Rose Cloud) ═══ */}
      {view === 'command' && <CommandCenterDashboard />}
    </div>
  );
}

// ─── Tiny inline button spinner ───────────────────────────────────────────────
function BtnSpinner() {
  return (
    <span style={{
      display: 'inline-block', width: 14, height: 14,
      border: '2.5px solid rgba(255,255,255,.35)',
      borderTopColor: '#fff', borderRadius: '50%',
      animation: 'spin .7s linear infinite',
    }} />
  );
}
