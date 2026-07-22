/**
 * MetricsDashboard.jsx — 5 KPI cards (dark mode)
 * Cards: Total · Avg Rating · Sentiment Breakdown · High Urgency · Net Score
 */

import MetricCard from './MetricCard';

function pct(count, total) {
  if (!total) return 0;
  return Math.round((count / total) * 100);
}

export default function MetricsDashboard({ reviews }) {
  const total = reviews.length;

  const avgRating = total
    ? (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / total).toFixed(1)
    : '—';

  const counts = reviews.reduce(
    (acc, r) => {
      const s = (r.sentiment ?? 'mixed').toLowerCase();
      if (s === 'positive') acc.pos += 1;
      else if (s === 'negative') acc.neg += 1;
      else acc.mix += 1;
      return acc;
    },
    { pos: 0, neg: 0, mix: 0 }
  );

  const highUrgency = reviews.filter((r) => r.urgency?.toLowerCase() === 'high').length;

  const pPos = pct(counts.pos, total);
  const pNeg = pct(counts.neg, total);
  const pMix = pct(counts.mix, total);
  const nss  = pPos - pNeg;
  const nssClass = nss >= 30 ? 'pos' : nss <= -30 ? 'neg' : 'mix';

  return (
    <div className="metrics-grid">
      {/* Total */}
      <MetricCard icon="📋" iconClass="brown" label="Total Reviews"
        value={total} sub={total ? 'reviews analysed' : 'fetch to begin'} />

      {/* Avg Rating */}
      <MetricCard icon="⭐" iconClass="amber" label="Average Rating"
        value={avgRating} sub={total ? 'out of 5.0' : '—'} />

      {/* Sentiment breakdown */}
      <MetricCard icon="🧠" iconClass="pink" label="Sentiment Breakdown"
        value={`${pPos}%`} sub="reviews are Positive">
        <div className="sentiment-breakdown">
          {[
            { label: 'Positive', cls: 'pos', pct: pPos },
            { label: 'Negative', cls: 'neg', pct: pNeg },
            { label: 'Mixed',    cls: 'mix', pct: pMix },
          ].map(({ label, cls, pct: p }) => (
            <div key={label} className="sent-row">
              <span className="sent-label">{label}</span>
              <div className="sent-bar-track">
                <div className={`sent-bar-fill ${cls}`} style={{ width: `${p}%` }} />
              </div>
              <span className="sent-pct">{p}%</span>
            </div>
          ))}
        </div>
      </MetricCard>

      {/* High Urgency */}
      <MetricCard icon="🚨" iconClass="neg" label="High Urgency"
        value={highUrgency}
        sub={highUrgency === 1 ? 'review needs attention' : 'reviews need attention'} />

      {/* Net Sentiment Score */}
      <MetricCard icon="📊" iconClass="violet" label="Net Sentiment Score"
        sub={nss >= 30 ? 'Excellent' : nss <= -30 ? 'Critical' : 'Neutral'}>
        <div className={`nss-score ${nssClass}`} style={{ marginTop: 4 }}>
          {nss > 0 ? '+' : ''}{total ? nss : '—'}
        </div>
      </MetricCard>
    </div>
  );
}
