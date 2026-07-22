/**
 * UdupiClinicDashboard.jsx
 *
 * "Guduchi Ayurveda Diabetes Reversal Clinic — Udupi"
 * Fetches every row from `reviews` where location = 'Udupi'
 * directly via the Supabase client.
 *
 * Typography contract:
 *   Headers / clinic title / reviewer names → Quando (serif)
 *   Review body text / dates / descriptions  → Maitree (serif)
 *   Ratings / numbers / badges / buttons     → Baloo Chettan 2 (sans-serif)
 *
 * Palette: Morning Mist  #F8FBFF → #B7D7E8 (vertical gradient)
 * Cards  : bg-white/60  backdrop-blur-md  border-[#B7D7E8]
 */

import '../tailwind.css';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const CLINIC_NAME    = 'Guduchi Ayurveda Diabetes Reversal Clinic';
const CLINIC_LOCATION = 'Udupi';
const LOCATION_FILTER = 'Udupi';   // matches the `location` column value

const F = {
  quando : { fontFamily: "'Quando', serif" },
  maitree: { fontFamily: "'Maitree', serif" },
  baloo  : { fontFamily: "'Baloo Chettan 2', sans-serif" },
};

const SORT_OPTIONS = [
  { value: 'newest',  label: 'Newest First'  },
  { value: 'oldest',  label: 'Oldest First'  },
  { value: 'highest', label: 'Highest Rated' },
  { value: 'lowest',  label: 'Lowest Rated'  },
];

/* ─────────────────────────────────────────────────────────────
   TINY HELPERS
───────────────────────────────────────────────────────────── */
function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function avg(arr, key) {
  if (!arr.length) return 0;
  return arr.reduce((s, r) => s + (r[key] ?? 0), 0) / arr.length;
}

/* ─────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────── */

/** Filled / empty star row */
function Stars({ rating = 0, size = 'text-lg' }) {
  const filled = Math.round(rating);
  return (
    <div className="flex gap-0.5 items-center">
      {[1,2,3,4,5].map(n => (
        <span key={n} className={`${size} leading-none ${n <= filled ? 'text-amber-400' : 'text-[#B7D7E8]'}`}>
          ★
        </span>
      ))}
    </div>
  );
}

/** Circular avatar with gradient */
function Avatar({ name }) {
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow"
      style={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #4A90B8 100%)', ...F.baloo }}
    >
      {initials(name)}
    </div>
  );
}

/** Sentiment badge */
function SentimentBadge({ sentiment }) {
  const s = (sentiment ?? '').toLowerCase();
  const map = {
    positive: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '✓', label: 'Positive' },
    negative: { cls: 'bg-rose-50    text-rose-700    border-rose-200',    icon: '✗', label: 'Negative' },
    mixed:    { cls: 'bg-amber-50   text-amber-700   border-amber-200',   icon: '~', label: 'Mixed'    },
  };
  const cfg = map[s] ?? map.mixed;
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${cfg.cls}`} style={F.baloo}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

/** Urgency badge */
function UrgencyBadge({ urgency }) {
  const high = (urgency ?? '').toLowerCase() === 'high';
  return (
    <span
      className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${
        high
          ? 'bg-rose-50 text-rose-600 border-rose-200'
          : 'bg-emerald-50 text-emerald-600 border-emerald-200'
      }`}
      style={F.baloo}
    >
      {high ? '🔴 High' : '🟢 Low'}
    </span>
  );
}

/** Theme chip */
function ThemeChip({ label }) {
  return (
    <span
      className="text-xs px-2.5 py-0.5 rounded-full bg-[#F0F7FF] border border-[#B7D7E8] text-[#4a6a8a] font-medium"
      style={F.maitree}
    >
      {label}
    </span>
  );
}

/* ── Hero Header ────────────────────────────────────────────── */
function ClinicHeader({ reviews }) {
  const total   = reviews.length;
  const avgRate = avg(reviews, 'rating').toFixed(1);
  const posCount = reviews.filter(r => r.sentiment?.toLowerCase() === 'positive').length;

  return (
    <div
      className="rounded-3xl overflow-hidden shadow-xl mb-6"
      style={{ background: 'linear-gradient(135deg, #0f2744 0%, #1a3a5c 50%, #2d6a9f 100%)' }}
    >
      {/* Top accent stripe */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #B7D7E8 0%, #4A90B8 50%, #B7D7E8 100%)' }} />

      <div className="p-6 md:p-10">
        {/* Clinic branding */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">

          {/* Left: title block */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#B7D7E8]/80 text-xs font-semibold tracking-widest uppercase" style={F.baloo}>
                📍 {CLINIC_LOCATION}
              </span>
            </div>
            <h1
              className="text-2xl md:text-3xl text-white leading-snug tracking-wide"
              style={F.quando}
            >
              {CLINIC_NAME}
            </h1>
            <p className="text-[#B7D7E8] mt-1 text-sm" style={F.maitree}>
              Ayurvedic excellence · Diabetes reversal specialists
            </p>

            {/* Tag pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {['Ayurveda', 'Diabetes Care', 'Holistic Health', 'Udupi'].map(tag => (
                <span
                  key={tag}
                  className="text-xs bg-white/10 text-[#B7D7E8] border border-[#B7D7E8]/30 px-3 py-1 rounded-full"
                  style={F.baloo}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right: rating block */}
          <div className="flex-shrink-0 text-center bg-white/10 border border-white/20 rounded-2xl px-8 py-5 backdrop-blur-sm">
            <div className="text-6xl md:text-7xl font-black text-white leading-none" style={F.baloo}>
              {total ? avgRate : '—'}
            </div>
            <div className="text-[#B7D7E8]/70 text-xs mb-2 mt-0.5" style={F.maitree}>out of 5.0</div>
            <Stars rating={parseFloat(avgRate)} size="text-xl" />
            <div className="mt-3 text-white font-semibold" style={F.baloo}>
              {total} <span className="text-[#B7D7E8] font-normal" style={F.maitree}>reviews</span>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        {total > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-6 border-t border-white/10 pt-5">
            {[
              { label: 'Happy Patients',  value: posCount,                   sub: 'Positive reviews'  },
              { label: 'Avg. Rating',     value: avgRate + ' ★',             sub: 'Overall score'     },
              { label: 'Response Rate',   value: '100%',                      sub: 'AI analysed'       },
            ].map(({ label, value, sub }) => (
              <div key={label} className="text-center">
                <div className="text-white font-bold text-xl md:text-2xl" style={F.baloo}>{value}</div>
                <div className="text-[#B7D7E8] text-xs mt-0.5" style={F.maitree}>{sub}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Star breakdown summary ─────────────────────────────────── */
function StarBreakdown({ reviews }) {
  const total = reviews.length || 1;
  return (
    <div className="bg-white/60 backdrop-blur-md border border-[#B7D7E8] rounded-2xl shadow-card p-5 mb-5">
      <h3 className="text-[#1a3a5c] text-base mb-4" style={F.quando}>Rating Breakdown</h3>
      <div className="flex flex-col gap-2">
        {[5, 4, 3, 2, 1].map(star => {
          const count = reviews.filter(r => r.rating === star).length;
          const pct   = Math.round((count / total) * 100);
          return (
            <div key={star} className="flex items-center gap-3">
              <span className="text-amber-400 text-sm w-5 flex-shrink-0 text-right" style={F.baloo}>{star}★</span>
              <div className="flex-1 h-2 rounded-full bg-[#B7D7E8]/30 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#4A90B8] transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[#7a9ab0] text-xs w-8 text-right flex-shrink-0" style={F.baloo}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Sentiment summary ──────────────────────────────────────── */
function SentimentSummary({ reviews }) {
  const total = reviews.length || 1;
  const items = [
    { key: 'positive', label: 'Positive', bar: 'bg-emerald-400', text: 'text-emerald-600' },
    { key: 'negative', label: 'Negative', bar: 'bg-rose-400',    text: 'text-rose-600'    },
    { key: 'mixed',    label: 'Mixed',    bar: 'bg-amber-400',   text: 'text-amber-600'   },
  ];
  return (
    <div className="bg-white/60 backdrop-blur-md border border-[#B7D7E8] rounded-2xl shadow-card p-5 mb-5">
      <h3 className="text-[#1a3a5c] text-base mb-4" style={F.quando}>Sentiment Analysis</h3>
      {items.map(({ key, label, bar, text }) => {
        const count = reviews.filter(r => (r.sentiment ?? '').toLowerCase() === key).length;
        const pct   = Math.round((count / total) * 100);
        return (
          <div key={key} className="mb-3 last:mb-0">
            <div className="flex justify-between mb-1">
              <span className={`text-xs font-semibold capitalize ${text}`} style={F.maitree}>{label}</span>
              <span className="text-xs text-[#7a9ab0]" style={F.baloo}>{count} ({pct}%)</span>
            </div>
            <div className="h-2 rounded-full bg-[#B7D7E8]/30 overflow-hidden">
              <div className={`h-full rounded-full ${bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Filter / Sort bar ──────────────────────────────────────── */
function FilterBar({ starFilter, setStarFilter, sortBy, setSortBy, total, showing }) {
  return (
    <div className="bg-white/60 backdrop-blur-md border border-[#B7D7E8] rounded-2xl shadow-card px-5 py-3 mb-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        {/* Star filters */}
        <div className="flex flex-wrap gap-1.5">
          {['all', 5, 4, 3, 2, 1].map(s => (
            <button
              key={s}
              onClick={() => setStarFilter(s)}
              className={`px-3 py-1 rounded-full text-sm font-semibold border transition-all duration-200 ${
                starFilter === s
                  ? 'bg-[#1a3a5c] text-white border-[#1a3a5c] shadow-sm'
                  : 'bg-white/70 text-[#4a6a8a] border-[#B7D7E8] hover:bg-[#B7D7E8]/30 hover:border-[#4A90B8]'
              }`}
              style={F.baloo}
            >
              {s === 'all' ? 'All' : `${s} ★`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#7a9ab0]" style={F.maitree}>
            Showing {showing} of {total}
          </span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-full border border-[#B7D7E8] bg-white/80 text-[#4a6a8a] outline-none focus:border-[#4A90B8] cursor-pointer"
            style={F.baloo}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

/* ── Review Card ─────────────────────────────────────────────── */
function ReviewCard({ review, index }) {
  const { author_name, rating, review_text, review_time, sentiment, urgency, themes = [] } = review;

  return (
    <div
      className="bg-white/60 backdrop-blur-md border border-[#B7D7E8] rounded-2xl shadow-card p-5 md:p-6
                 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 flex flex-col gap-4"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Header: avatar + name + meta */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Avatar name={author_name} />
          <div>
            <div className="text-[#1a3a5c] font-semibold text-base leading-tight" style={F.quando}>
              {author_name}
            </div>
            <div className="text-[#7a9ab0] text-xs mt-0.5" style={F.maitree}>
              {fmtDate(review_time)}
            </div>
          </div>
        </div>

        {/* Rating badge */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Stars rating={rating} size="text-sm" />
            <span
              className="text-sm font-bold text-[#4A90B8] bg-[#F0F7FF] border border-[#B7D7E8] px-2 py-0.5 rounded-full"
              style={F.baloo}
            >
              {rating} / 5
            </span>
          </div>
          <div className="flex gap-1.5 flex-wrap justify-end">
            {sentiment && <SentimentBadge sentiment={sentiment} />}
            {urgency    && <UrgencyBadge   urgency={urgency}     />}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#B7D7E8]/60 to-transparent" />

      {/* Review body */}
      {review_text && (
        <blockquote className="relative pl-5 text-[#4a6a8a] text-sm md:text-base leading-relaxed italic" style={F.maitree}>
          <span
            className="absolute left-0 top-[-4px] text-3xl text-[#B7D7E8]/80 font-serif leading-none select-none"
            aria-hidden="true"
          >
            "
          </span>
          {review_text}
          <span className="text-[#B7D7E8]/80 font-serif not-italic ml-0.5">"</span>
        </blockquote>
      )}

      {/* Theme chips */}
      {themes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {themes.map(t => <ThemeChip key={t} label={t} />)}
        </div>
      )}
    </div>
  );
}

/* ── Skeleton card ───────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white/60 backdrop-blur-md border border-[#B7D7E8] rounded-2xl p-6 flex flex-col gap-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#B7D7E8]/40" />
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-36 rounded-full bg-[#B7D7E8]/40" />
          <div className="h-3 w-24 rounded-full bg-[#B7D7E8]/25" />
        </div>
      </div>
      <div className="h-px bg-[#B7D7E8]/30" />
      <div className="flex flex-col gap-2">
        <div className="h-3 rounded-full bg-[#B7D7E8]/35 w-full" />
        <div className="h-3 rounded-full bg-[#B7D7E8]/25 w-5/6" />
        <div className="h-3 rounded-full bg-[#B7D7E8]/15 w-4/6" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function UdupiClinicDashboard() {
  const [reviews,    setReviews]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [starFilter, setStarFilter] = useState('all');
  const [sortBy,     setSortBy]     = useState('newest');

  /* ── useEffect: fetch from Supabase where location = 'Udupi' ── */
  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      setLoading(true);
      setError(null);

      // Primary query: filter by location column (requires migration)
      let { data, error: err } = await supabase
        .from('reviews')
        .select('*')
        .eq('location', LOCATION_FILTER)
        .order('review_time', { ascending: false });

      // Fallback: if location column doesn't exist yet (PGRST116),
      // fetch all rows so the UI is still functional before migration.
      if (err && (err.code === 'PGRST116' || err.message?.includes('column'))) {
        console.warn('[UdupiClinicDashboard] location column not found — fetching all rows as fallback');
        ({ data, error: err } = await supabase
          .from('reviews')
          .select('*')
          .order('review_time', { ascending: false }));
      }

      if (cancelled) return;

      if (err) {
        setError(err.message);
      } else {
        setReviews(data ?? []);
      }
      setLoading(false);
    }

    loadReviews();
    return () => { cancelled = true; };
  }, []);

  /* ── Client-side filter + sort ── */
  const displayed = useMemo(() => {
    let arr = starFilter === 'all'
      ? reviews
      : reviews.filter(r => r.rating === starFilter);

    return [...arr].sort((a, b) => {
      if (sortBy === 'newest')  return new Date(b.review_time) - new Date(a.review_time);
      if (sortBy === 'oldest')  return new Date(a.review_time) - new Date(b.review_time);
      if (sortBy === 'highest') return (b.rating ?? 0) - (a.rating ?? 0);
      if (sortBy === 'lowest')  return (a.rating ?? 0) - (b.rating ?? 0);
      return 0;
    });
  }, [reviews, starFilter, sortBy]);

  /* ── Render ── */
  return (
    <div
      className="min-h-screen w-full"
      style={{ background: 'linear-gradient(to bottom, #F8FBFF 0%, #B7D7E8 100%)' }}
    >
      <div className="max-w-5xl mx-auto px-4 py-8 md:px-8 md:py-10">

        {/* ─── Hero header ─── */}
        <ClinicHeader reviews={reviews} />

        {/* ─── Main layout: sidebar (lg) + feed ─── */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">

          {/* Sidebar */}
          {!loading && reviews.length > 0 && (
            <aside className="w-full lg:w-64 flex-shrink-0">
              <StarBreakdown   reviews={reviews} />
              <SentimentSummary reviews={reviews} />

              {/* Urgency count */}
              <div className="bg-white/60 backdrop-blur-md border border-[#B7D7E8] rounded-2xl shadow-card p-5">
                <h3 className="text-[#1a3a5c] text-base mb-3" style={F.quando}>Urgency Queue</h3>
                {reviews.filter(r => r.urgency?.toLowerCase() === 'high').length === 0 ? (
                  <p className="text-[#7a9ab0] text-sm flex items-center gap-2" style={F.maitree}>
                    <span>✅</span> No high-urgency reviews
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {reviews
                      .filter(r => r.urgency?.toLowerCase() === 'high')
                      .map((r, i) => (
                        <div key={r.id ?? i} className="flex gap-2 p-2 bg-rose-50 rounded-lg border border-rose-100">
                          <span className="text-xs mt-0.5">🔴</span>
                          <div>
                            <div className="text-rose-700 text-xs font-semibold" style={F.quando}>{r.author_name}</div>
                            <div className="text-rose-500 text-xs mt-0.5" style={F.maitree}>
                              {(r.review_text ?? '').slice(0, 60)}…
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* Review feed */}
          <div className="flex-1 min-w-0">

            {/* Filter bar */}
            {!loading && reviews.length > 0 && (
              <FilterBar
                starFilter={starFilter}
                setStarFilter={setStarFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
                total={reviews.length}
                showing={displayed.length}
              />
            )}

            {/* Error */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-sm mb-4 flex items-center gap-2" style={F.maitree}>
                ⚠️ Supabase error: {error}
              </div>
            )}

            {/* Loading illustration */}
            {loading && (
              <div className="bg-white/60 backdrop-blur-md border border-[#B7D7E8] rounded-2xl p-10 flex flex-col items-center justify-center text-center min-h-[360px]">
                <div className="relative max-w-xs w-full mb-6">
                  <img
                    src="/loading.png"
                    alt="Loading..."
                    className="w-full h-auto object-contain mx-auto"
                    style={{ maxHeight: '200px' }}
                  />
                </div>
                <h3 className="text-lg text-[#1a3a5c] mb-2" style={{ ...F.quando, fontWeight: 600 }}>
                  Syncing Udupi Clinic Feed
                </h3>
                <p className="text-xs text-[#7a9ab0]" style={F.maitree}>
                  Loading latest patient review records from Supabase...
                </p>
              </div>
            )}

            {/* No results */}
            {!loading && displayed.length === 0 && !error && (
              <div className="bg-white/60 backdrop-blur-md border border-[#B7D7E8] rounded-2xl p-12 text-center">
                <div className="text-5xl mb-3">📭</div>
                <h3 className="text-[#1a3a5c] text-xl" style={F.quando}>No Reviews Found</h3>
                <p className="text-[#7a9ab0] text-sm mt-2" style={F.maitree}>
                  {reviews.length === 0
                    ? `No reviews were found for location: ${LOCATION_FILTER}.`
                    : 'No reviews match the selected star filter.'}
                </p>
              </div>
            )}

            {/* Review cards */}
            {!loading && displayed.length > 0 && (
              <div className="flex flex-col gap-4">
                {displayed.map((r, i) => (
                  <ReviewCard
                    key={r.id ?? `${r.author_name}-${i}`}
                    review={r}
                    index={i}
                  />
                ))}
              </div>
            )}

            {/* Footer count */}
            {!loading && displayed.length > 0 && (
              <p className="text-center text-xs text-[#7a9ab0] mt-6" style={F.maitree}>
                Showing {displayed.length} of {reviews.length} reviews ·{' '}
                Supabase · <code className="font-mono bg-white/50 px-1.5 py-0.5 rounded border border-[#B7D7E8]">location = '{LOCATION_FILTER}'</code>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
