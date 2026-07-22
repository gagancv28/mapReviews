/**
 * CommandCenterDashboard.jsx
 *
 * Rose Cloud palette: #FFF5F7 (Cloud White) → #F5D0D7 (Rose Dust)
 *
 * Typography:
 *   Headers / titles / names  → Quando   (serif)
 *   Metric numbers / badges   → Baloo Chettan 2  (sans-serif)
 *   Table body / descriptions → Maitree  (serif)
 *
 * Data: live Supabase SELECT on mount — all KPIs computed client-side.
 */

import '../tailwind.css';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

/* ─── Font shorthand helpers ─────────────────────────────── */
const F = {
  quando : { fontFamily: "'Quando', serif" },
  maitree: { fontFamily: "'Maitree', serif" },
  baloo  : { fontFamily: "'Baloo Chettan 2', sans-serif" },
};

/* ─── Palette ────────────────────────────────────────────── */
const C = {
  bg:      'linear-gradient(to bottom, #FFF5F7 0%, #F5D0D7 100%)',
  card:    'bg-white/60 backdrop-blur-md border border-[#F5D0D7] rounded-2xl shadow-card',
  primary: '#3d1a24',
  rose:    '#c84b6b',
  muted:   '#a06070',
  border:  '#F5D0D7',
};

/* ─── Helpers ────────────────────────────────────────────── */
function pct(n, total) { return total ? Math.round((n / total) * 100) : 0; }

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function fmtDay(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function todayStr() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

/* ─── Build last-7-day trend data ────────────────────────── */
function buildTrend(reviews) {
  const days = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days[key] = { date: fmtDay(key), reviews: 0, positive: 0 };
  }
  reviews.forEach(r => {
    const key = new Date(r.review_time).toISOString().slice(0, 10);
    if (days[key]) {
      days[key].reviews  += 1;
      if ((r.sentiment ?? '').toLowerCase() === 'positive') days[key].positive += 1;
    }
  });
  return Object.values(days);
}

/* ─── Build theme frequency ──────────────────────────────── */
function buildThemes(reviews) {
  const map = {};
  reviews.forEach(r => (r.themes ?? []).forEach(t => { map[t] = (map[t] ?? 0) + 1; }));
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));
}

/* ═══════════════════════════════════════════════════════════
   KPI CARD
═══════════════════════════════════════════════════════════ */
function KpiCard({ icon, iconBg, label, value, sub, trend, trendUp }) {
  return (
    <div className={`${C.card} p-5 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover`}>
      {/* Icon + label */}
      <div className="flex items-center justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${iconBg}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
              trendUp
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-rose-700 bg-rose-50 border-rose-200'
            }`}
            style={F.baloo}
          >
            {trendUp ? '▲' : '▼'} {trend}
          </span>
        )}
      </div>

      {/* Metric */}
      <div>
        <div className="text-xs font-semibold text-[#a06070] uppercase tracking-widest mb-1" style={F.baloo}>
          {label}
        </div>
        <div className="text-4xl font-black text-[#3d1a24] leading-none" style={F.baloo}>
          {value}
        </div>
        {sub && (
          <div className="text-sm text-[#a06070] mt-1.5" style={F.maitree}>{sub}</div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   RECENT REVIEWS TABLE
═══════════════════════════════════════════════════════════ */
function SentimentDot({ s }) {
  const map = {
    positive: 'bg-emerald-400',
    negative: 'bg-rose-400',
    mixed:    'bg-amber-400',
  };
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${map[(s ?? '').toLowerCase()] ?? 'bg-gray-300'} mr-1.5`} />
  );
}

function RecentReviews({ reviews }) {
  const recent = reviews.slice(0, 8);
  return (
    <div className={`${C.card} p-5 flex flex-col h-full`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#3d1a24] text-lg" style={F.quando}>Recent Activity</h3>
        <span className="text-xs text-[#a06070] font-semibold" style={F.baloo}>
          Latest {recent.length} reviews
        </span>
      </div>

      {/* Table header */}
      <div
        className="grid gap-3 px-3 py-2 rounded-xl mb-2 text-xs font-bold text-[#a06070] uppercase tracking-wider"
        style={{ gridTemplateColumns: '1fr 60px 80px 80px', background: 'rgba(245,208,215,.35)', ...F.baloo }}
      >
        <span>Reviewer</span>
        <span className="text-center">Stars</span>
        <span className="text-center">Mood</span>
        <span className="text-right">Date</span>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-1 flex-1 overflow-hidden">
        {recent.map((r, i) => (
          <div
            key={r.id ?? i}
            className="grid gap-3 px-3 py-2.5 rounded-xl hover:bg-[#FFF0F2]/80 transition-colors"
            style={{ gridTemplateColumns: '1fr 60px 80px 80px' }}
          >
            {/* Name + snippet */}
            <div className="min-w-0">
              <div className="text-[#3d1a24] font-semibold text-sm truncate" style={F.quando}>
                {r.author_name}
              </div>
              <div className="text-[#a06070] text-xs truncate" style={F.maitree}>
                {(r.review_text ?? '—').slice(0, 45)}{(r.review_text ?? '').length > 45 ? '…' : ''}
              </div>
            </div>

            {/* Stars */}
            <div className="flex justify-center items-center">
              <span className="text-amber-400 text-sm" style={F.baloo}>
                {'★'.repeat(r.rating ?? 0)}{'☆'.repeat(5 - (r.rating ?? 0))}
              </span>
            </div>

            {/* Sentiment */}
            <div className="flex justify-center items-center">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                  (r.sentiment ?? '').toLowerCase() === 'positive' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  (r.sentiment ?? '').toLowerCase() === 'negative' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  'bg-amber-50 text-amber-700 border-amber-200'
                }`}
                style={F.baloo}
              >
                {r.sentiment ?? '—'}
              </span>
            </div>

            {/* Date */}
            <div className="flex items-center justify-end">
              <span className="text-xs text-[#a06070]" style={F.maitree}>{fmtDate(r.review_time)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TREND AREA CHART
═══════════════════════════════════════════════════════════ */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/90 border border-[#F5D0D7] rounded-xl px-3 py-2 shadow-md text-xs" style={F.maitree}>
      <div className="font-semibold text-[#3d1a24] mb-1">{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-1.5 text-[#a06070]">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <strong style={{ color: '#3d1a24', ...F.baloo }}>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

function TrendChart({ reviews }) {
  const data = buildTrend(reviews);
  return (
    <div className={`${C.card} p-5 flex flex-col justify-between h-full`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#3d1a24] text-lg" style={F.quando}>Weekly Review Trend</h3>
        <div className="flex items-center gap-3 text-xs" style={F.baloo}>
          <span className="flex items-center gap-1.5 text-[#a06070]">
            <span className="w-3 h-0.5 bg-[#c84b6b] inline-block rounded" /> Total
          </span>
          <span className="flex items-center gap-1.5 text-[#a06070]">
            <span className="w-3 h-0.5 bg-emerald-400 inline-block rounded" /> Positive
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="roseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#c84b6b" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#c84b6b" stopOpacity={0}    />
            </linearGradient>
            <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10b981" stopOpacity={0.20} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F5D0D7" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#c09aaa', fontFamily: 'Maitree, serif' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#c09aaa', fontFamily: 'Maitree, serif' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="reviews"  name="Total"    stroke="#c84b6b" strokeWidth={2} fill="url(#roseGrad)"  dot={{ fill: '#c84b6b',  r: 3 }} activeDot={{ r: 5 }} />
          <Area type="monotone" dataKey="positive" name="Positive" stroke="#10b981" strokeWidth={2} fill="url(#greenGrad)" dot={{ fill: '#10b981', r: 3 }} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   THEME BREAKDOWN
═══════════════════════════════════════════════════════════ */
const PIE_COLORS = ['#c84b6b', '#d4637a', '#e07a90', '#ea9aac', '#f5b8c8', '#fad0d8'];

function ThemeBreakdown({ reviews }) {
  const themes = buildThemes(reviews);
  const total  = themes.reduce((s, t) => s + t.count, 0) || 1;

  return (
    <div className={`${C.card} p-5 flex flex-col gap-4`}>
      <h3 className="text-[#3d1a24] text-lg" style={F.quando}>Top AI Themes</h3>

      {/* Mini donut */}
      {themes.length > 0 && (
        <div className="flex items-center gap-4">
          <PieChart width={90} height={90}>
            <Pie data={themes} dataKey="count" cx="50%" cy="50%" innerRadius={25} outerRadius={42} paddingAngle={3}>
              {themes.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
          {/* Legend */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            {themes.slice(0, 4).map((t, i) => (
              <div key={t.name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-xs text-[#6b3040] truncate" style={F.maitree}>{t.name}</span>
                </div>
                <span className="text-xs font-bold text-[#3d1a24] flex-shrink-0" style={F.baloo}>{pct(t.count, total)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full chips */}
      <div className="flex flex-wrap gap-1.5">
        {themes.map((t, i) => (
          <span
            key={t.name}
            className="text-xs px-2.5 py-0.5 rounded-full font-medium border"
            style={{ background: `${PIE_COLORS[i]}18`, color: PIE_COLORS[i], borderColor: `${PIE_COLORS[i]}40`, ...F.baloo }}
          >
            {t.name} · {t.count}
          </span>
        ))}
        {themes.length === 0 && (
          <span className="text-sm text-[#a06070]" style={F.maitree}>No themes found</span>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   URGENCY PANEL
═══════════════════════════════════════════════════════════ */
function UrgencyPanel({ reviews }) {
  const high = reviews.filter(r => (r.urgency ?? '').toLowerCase() === 'high');
  return (
    <div className={`${C.card} p-5 flex flex-col gap-3 h-full`}>
      <div className="flex items-center justify-between flex-shrink-0">
        <h3 className="text-[#3d1a24] text-lg" style={F.quando}>Urgency Queue</h3>
        {high.length > 0 && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200" style={F.baloo}>
            {high.length} alert{high.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {high.length === 0 ? (
        <div className="text-center py-8 text-[#a06070] text-sm flex flex-col items-center justify-center gap-2 flex-1" style={F.maitree}>
          <span className="text-3xl">✅</span>
          All clear — no high-urgency reviews
        </div>
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto pr-1 flex-1 max-h-[195px] custom-scrollbar">
          {high.map((r, i) => (
            <div key={r.id ?? i} className="flex gap-2.5 p-3 rounded-xl bg-rose-50/70 border border-rose-100 flex-shrink-0">
              <span className="text-base mt-0.5 flex-shrink-0">🔴</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-rose-800 truncate" style={F.quando}>{r.author_name}</div>
                <div className="text-xs text-rose-600 mt-0.5 line-clamp-2" style={F.maitree}>
                  {r.review_text || '—'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMMAND CENTER
═══════════════════════════════════════════════════════════ */
export default function CommandCenterDashboard() {
  const [reviews,   setReviews]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [refreshed, setRefreshed] = useState(new Date());

  /* ── Fetch all reviews ── */
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('reviews')
        .select('*')
        .order('review_time', { ascending: false });
      if (cancelled) return;
      if (err) setError(err.message);
      else { setReviews(data ?? []); setRefreshed(new Date()); }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  /* ── Computed KPIs ── */
  const total   = reviews.length;
  const avgRat  = total ? (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / total).toFixed(1) : '—';
  const posCount = reviews.filter(r => (r.sentiment ?? '').toLowerCase() === 'positive').length;
  const highUrg  = reviews.filter(r => (r.urgency  ?? '').toLowerCase() === 'high').length;
  const satPct   = total ? `${pct(posCount, total)}%` : '—';

  const kpis = [
    {
      icon: '📋', iconBg: 'bg-rose-100',
      label: 'Total Reviews', value: total || '—',
      sub: 'reviews analysed',
      trend: null,
    },
    {
      icon: '⭐', iconBg: 'bg-amber-100',
      label: 'Average Rating', value: avgRat,
      sub: 'out of 5.0',
      trend: null,
    },
    {
      icon: '😊', iconBg: 'bg-emerald-100',
      label: 'Satisfaction Rate', value: satPct,
      sub: `${posCount} positive reviews`,
      trend: total ? `${pct(posCount, total)}%` : null,
      trendUp: pct(posCount, total) >= 50,
    },
    {
      icon: '🚨', iconBg: 'bg-rose-100',
      label: 'Needs Attention', value: highUrg || '—',
      sub: 'high urgency reviews',
      trend: highUrg > 0 ? `${highUrg} high` : null,
      trendUp: false,
    },
  ];

  /* ── Render ── */
  return (
    <div
      className="min-h-screen w-full"
      style={{ background: 'linear-gradient(to bottom, #FFF5F7 0%, #F5D0D7 100%)' }}
    >
      <div className="max-w-7xl mx-auto px-4 py-6 md:px-8">

        {/* ── Internal Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1
              className="text-3xl md:text-4xl text-[#3d1a24] leading-tight"
              style={F.quando}
            >
              Command Center <span style={{ color: '#c84b6b' }}>Overview</span>
            </h1>
            <p className="text-sm text-[#a06070] mt-1" style={F.maitree}>
              📅 {todayStr()}
            </p>
          </div>

          {/* Database actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Live indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 border border-[#F5D0D7] rounded-full backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-[#a06070]" style={F.baloo}>Live Supabase</span>
            </div>

            {/* Refresh button */}
            <button
              onClick={() => {
                setLoading(true);
                supabase.from('reviews').select('*').order('review_time', { ascending: false })
                  .then(({ data, error: err }) => {
                    if (!err) { setReviews(data ?? []); setRefreshed(new Date()); }
                    setLoading(false);
                  });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 border border-[#F5D0D7] rounded-full backdrop-blur-sm text-xs font-semibold text-[#a06070] hover:bg-white/80 transition-all cursor-pointer"
              style={F.baloo}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl p-4 mb-6 flex items-center gap-2" style={F.maitree}>
            ⚠️ Supabase error: {error}
          </div>
        )}

        {loading ? (
          <div className={`${C.card} p-10 md:p-16 flex flex-col items-center justify-center my-8 text-center min-h-[480px]`}>
            <div className="relative max-w-sm w-full mb-6">
              <img
                src="/loading.png"
                alt="Loading..."
                className="w-full h-auto object-contain mx-auto"
                style={{ maxHeight: '260px' }}
              />
            </div>
            <h3 className="text-xl md:text-2xl text-[#3d1a24] mb-2" style={{ ...F.quando, fontWeight: 600 }}>
              Synchronizing Command Center
            </h3>
            <p className="text-sm md:text-base text-[#a06070]" style={F.maitree}>
              Fetching latest reviews and recalculating analytics from Supabase...
            </p>
          </div>
        ) : (
          <>
            {/* ── KPI Grid ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {kpis.map(k => <KpiCard key={k.label} {...k} />)}
            </div>

            {/* ── Trend + Urgency row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="lg:col-span-2">
                <TrendChart reviews={reviews} />
              </div>
              <div>
                <UrgencyPanel reviews={reviews} />
              </div>
            </div>

            {/* ── Recent Reviews + Theme Breakdown ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
              {/* Reviews table — takes 2/3 */}
              <div className="xl:col-span-2">
                <RecentReviews reviews={reviews} />
              </div>
              {/* Theme breakdown — takes 1/3 */}
              <div>
                <ThemeBreakdown reviews={reviews} />
              </div>
            </div>

            {/* ── Footer bar ── */}
            <p className="text-center text-xs text-[#c09aaa] py-3" style={F.maitree}>
              Guduchi Ayurveda Diabetes Reversal Clinic ·
              Data synced at {refreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} ·
              {total} rows from <code className="bg-white/50 px-1.5 py-0.5 rounded border border-[#F5D0D7] font-mono">reviews</code>
            </p>
          </>
        )}

      </div>
    </div>
  );
}
