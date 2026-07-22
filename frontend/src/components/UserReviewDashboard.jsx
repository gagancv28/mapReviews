/**
 * UserReviewDashboard.jsx
 *
 * Morning Mist palette (#F8FBFF → #B7D7E8) review board.
 * Typography:
 *   • Headers / card-titles  → Quando (serif)
 *   • Body / review text     → Maitree (serif)
 *   • Scores / badges / nums → Baloo Chettan 2 (sans-serif)
 *
 * Data: fetched directly from Supabase reviews table.
 */

import '../tailwind.css';
import { useState, useEffect, useMemo } from 'react';
import { fetchReviewsFromDB } from '../services/reviewsService';

// ─── tiny helpers ──────────────────────────────────────────
const F = {
  quando:  { fontFamily: "'Quando', serif" },
  maitree: { fontFamily: "'Maitree', serif" },
  baloo:   { fontFamily: "'Baloo Chettan 2', sans-serif" },
};

function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── sub-components ────────────────────────────────────────

function StarRow({ rating = 0, size = 'text-lg', max = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`${size} leading-none ${i < Math.round(rating) ? 'text-amber-400' : 'text-[#B7D7E8]'}`}>★</span>
      ))}
    </div>
  );
}

function Avatar({ name }) {
  return (
    <div
      className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm"
      style={{ background: 'linear-gradient(135deg, #4A90B8 0%, #B7D7E8 100%)', ...F.baloo }}
    >
      {initials(name)}
    </div>
  );
}

function SentimentBadge({ sentiment }) {
  const s = (sentiment ?? '').toLowerCase();
  const cfg = {
    positive: { cls: 'badge-positive', label: '✓ Positive' },
    negative: { cls: 'badge-negative', label: '✗ Negative' },
    mixed:    { cls: 'badge-mixed',    label: '~ Mixed'    },
  }[s] ?? { cls: 'badge-mixed', label: '~ Mixed' };

  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${cfg.cls}`} style={F.baloo}>
      {cfg.label}
    </span>
  );
}

function UrgencyBadge({ urgency }) {
  if (!urgency) return null;
  const high = urgency.toLowerCase() === 'high';
  return (
    <span
      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
        high ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
      }`}
      style={F.baloo}
    >
      {high ? '🔴 High' : '🟢 Low'}
    </span>
  );
}

function ThemePill({ label }) {
  return (
    <span
      className="text-xs px-2.5 py-0.5 rounded-full bg-[#F8FBFF] border border-[#B7D7E8] text-[#4a6a8a] font-medium"
      style={F.maitree}
    >
      {label}
    </span>
  );
}

// ─── Rating Summary Card ────────────────────────────────────
function RatingSummaryCard({ reviews }) {
  const total = reviews.length;
  const avg   = total ? (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / total) : 0;

  const byStar = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }));

  return (
    <div className="card-glass p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
      {/* Left: big score */}
      <div className="text-center md:text-left flex-shrink-0">
        <div className="text-8xl font-bold leading-none text-[#1a3a5c]" style={F.baloo}>
          {avg.toFixed(1)}
        </div>
        <div className="text-sm text-[#7a9ab0] mt-1 mb-3" style={F.maitree}>out of 5.0</div>
        <StarRow rating={avg} size="text-2xl" />
        <div className="mt-3 text-[#4a6a8a] font-semibold" style={F.baloo}>
          {total} Review{total !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Divider */}
      <div className="hidden md:block w-px self-stretch bg-[#B7D7E8]/60" />

      {/* Right: star breakdown bars */}
      <div className="flex flex-col gap-2.5 flex-1 w-full">
        {byStar.map(({ star, count }) => {
          const pct = total ? Math.round((count / total) * 100) : 0;
          return (
            <div key={star} className="flex items-center gap-3">
              <span className="text-amber-400 text-sm w-4 flex-shrink-0" style={F.baloo}>{star}★</span>
              <div className="bar-track">
                <div
                  className="bar-fill bg-ocean"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-[#7a9ab0] text-xs w-8 text-right flex-shrink-0" style={F.baloo}>
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Sentiment summary */}
      <div className="hidden lg:flex flex-col gap-3 flex-shrink-0 min-w-[130px]">
        {['positive', 'negative', 'mixed'].map(s => {
          const count = reviews.filter(r => (r.sentiment ?? '').toLowerCase() === s).length;
          const pct   = total ? Math.round((count / total) * 100) : 0;
          const colours = {
            positive: { bar: 'bg-emerald-400', text: 'text-emerald-600' },
            negative: { bar: 'bg-rose-400',    text: 'text-rose-600'    },
            mixed:    { bar: 'bg-amber-400',    text: 'text-amber-600'  },
          }[s];
          return (
            <div key={s} className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className={`capitalize text-xs font-semibold ${colours.text}`} style={F.maitree}>{s}</span>
                <span className="text-xs text-[#7a9ab0]" style={F.baloo}>{pct}%</span>
              </div>
              <div className="bar-track">
                <div className={`bar-fill ${colours.bar}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Filter Bar ─────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'newest',  label: 'Newest First' },
  { value: 'oldest',  label: 'Oldest First' },
  { value: 'highest', label: 'Highest Rated' },
  { value: 'lowest',  label: 'Lowest Rated'  },
];

function FilterBar({ starFilter, setStarFilter, sortBy, setSortBy, total, filtered }) {
  const stars = ['all', 5, 4, 3, 2, 1];
  return (
    <div className="card-glass px-5 py-4 flex flex-wrap gap-3 items-center justify-between">
      {/* Star filters */}
      <div className="flex flex-wrap gap-2">
        {stars.map(s => (
          <button
            key={s}
            className={`btn-filter ${starFilter === s ? 'btn-filter-active' : 'btn-filter-inactive'}`}
            onClick={() => setStarFilter(s)}
          >
            {s === 'all' ? 'All Reviews' : `${s} ★`}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {/* Count badge */}
        <span className="text-sm text-[#7a9ab0]" style={F.maitree}>
          {filtered} of {total}
        </span>

        {/* Sort dropdown */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="text-sm px-3 py-1.5 rounded-full border border-[#B7D7E8] bg-white/70
                     text-[#4a6a8a] cursor-pointer outline-none focus:border-ocean"
          style={F.baloo}
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ─── Review Card ─────────────────────────────────────────────
function ReviewCard({ review, index }) {
  const { author_name, rating, review_text, review_time, sentiment, urgency, themes = [] } = review;

  return (
    <div
      className="card-glass p-5 md:p-6 flex flex-col gap-4"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 justify-between flex-wrap">
        <div className="flex items-center gap-3">
          <Avatar name={author_name} />
          <div>
            <div className="font-semibold text-[#1a3a5c] text-base leading-tight" style={F.quando}>
              {author_name}
            </div>
            <div className="text-xs text-[#7a9ab0] mt-0.5" style={F.maitree}>
              {fmtDate(review_time)}
            </div>
          </div>
        </div>

        {/* Rating + badges */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <StarRow rating={rating} size="text-base" />
            <span className="text-sm font-bold text-[#4A90B8]" style={F.baloo}>{rating}/5</span>
          </div>
          <div className="flex gap-1.5 flex-wrap justify-end">
            <SentimentBadge sentiment={sentiment} />
            <UrgencyBadge urgency={urgency} />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#B7D7E8]/40" />

      {/* Review text */}
      {review_text && (
        <blockquote
          className="text-[#4a6a8a] leading-relaxed text-sm md:text-base italic relative pl-4"
          style={F.maitree}
        >
          <span className="absolute left-0 top-0 text-[#B7D7E8] text-3xl leading-none font-serif">"</span>
          {review_text}
          <span className="text-[#B7D7E8] font-serif">"</span>
        </blockquote>
      )}

      {/* Theme pills */}
      {themes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {themes.map(t => <ThemePill key={t} label={t} />)}
        </div>
      )}
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="card-glass p-6 flex flex-col gap-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-[#B7D7E8]/50" />
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-32 rounded bg-[#B7D7E8]/50" />
          <div className="h-3 w-20 rounded bg-[#B7D7E8]/30" />
        </div>
      </div>
      <div className="h-px bg-[#B7D7E8]/40" />
      <div className="flex flex-col gap-2">
        <div className="h-3 rounded bg-[#B7D7E8]/40 w-full" />
        <div className="h-3 rounded bg-[#B7D7E8]/30 w-5/6" />
        <div className="h-3 rounded bg-[#B7D7E8]/20 w-4/6" />
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────
export default function UserReviewDashboard() {
  const [reviews,    setReviews]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [starFilter, setStarFilter] = useState('all');
  const [sortBy,     setSortBy]     = useState('newest');

  // Fetch from Supabase on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error: err } = await fetchReviewsFromDB({ limit: 500 });
      if (err) setError(err.message);
      else setReviews(data);
      setLoading(false);
    })();
  }, []);

  // Client-side filter + sort
  const displayed = useMemo(() => {
    let arr = starFilter === 'all' ? reviews : reviews.filter(r => r.rating === starFilter);
    return [...arr].sort((a, b) => {
      if (sortBy === 'newest')  return new Date(b.review_time) - new Date(a.review_time);
      if (sortBy === 'oldest')  return new Date(a.review_time) - new Date(b.review_time);
      if (sortBy === 'highest') return (b.rating ?? 0) - (a.rating ?? 0);
      if (sortBy === 'lowest')  return (a.rating ?? 0) - (b.rating ?? 0);
      return 0;
    });
  }, [reviews, starFilter, sortBy]);

  return (
    <div
      className="min-h-screen w-full px-4 py-10 md:px-8 lg:px-16"
      style={{ background: 'linear-gradient(to bottom, #F8FBFF 0%, #B7D7E8 100%)' }}
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-6">

        {/* ── Page title ── */}
        <div className="text-center mb-2">
          <h1 className="text-4xl md:text-5xl text-[#1a3a5c] tracking-wide" style={F.quando}>
            Customer Reviews
          </h1>
          <p className="mt-2 text-[#7a9ab0] text-base" style={F.maitree}>
            What our customers are saying — powered by live Supabase data
          </p>
        </div>

        {/* ── Error state ── */}
        {error && (
          <div className="card-glass p-4 border-rose-200 bg-rose-50/60 text-rose-700 text-sm flex items-center gap-2" style={F.maitree}>
            ⚠️ {error}
          </div>
        )}

        {/* ── Rating Summary ── */}
        {!loading && reviews.length > 0 && <RatingSummaryCard reviews={reviews} />}

        {/* ── Filter Bar ── */}
        {!loading && reviews.length > 0 && (
          <FilterBar
            starFilter={starFilter}
            setStarFilter={setStarFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            total={reviews.length}
            filtered={displayed.length}
          />
        )}

        {/* ── Review Feed ── */}
        {loading ? (
          <div className="card-glass p-10 flex flex-col items-center justify-center text-center min-h-[360px]">
            <div className="relative max-w-xs w-full mb-6">
              <img
                src="/loading.png"
                alt="Loading..."
                className="w-full h-auto object-contain mx-auto"
                style={{ maxHeight: '200px' }}
              />
            </div>
            <h3 className="text-lg text-[#1a3a5c] mb-2" style={{ ...F.quando, fontWeight: 600 }}>
              Loading Customer Reviews
            </h3>
            <p className="text-xs text-[#7a9ab0]" style={F.maitree}>
              Retrieving database logs from Supabase...
            </p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="card-glass p-12 text-center">
            <div className="text-5xl mb-3">📭</div>
            <div className="text-xl text-[#1a3a5c]" style={F.quando}>No Reviews Found</div>
            <p className="text-[#7a9ab0] text-sm mt-2" style={F.maitree}>
              {reviews.length === 0
                ? 'Your Supabase reviews table appears to be empty.'
                : 'No reviews match the selected filter.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {displayed.map((r, i) => (
              <ReviewCard key={r.id ?? `${r.author_name}-${i}`} review={r} index={i} />
            ))}
          </div>
        )}

        {/* Footer */}
        {!loading && displayed.length > 0 && (
          <p className="text-center text-xs text-[#7a9ab0] pt-2" style={F.maitree}>
            Showing {displayed.length} of {reviews.length} reviews · Live Supabase data
          </p>
        )}
      </div>
    </div>
  );
}
