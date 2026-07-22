/**
 * SentimentChart.jsx  (weekly trend line — dark mode)
 * Shows daily Positive / Negative / Mixed counts over the last 7 days.
 */

import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

function getWeekLabel(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}

function buildChartData(reviews) {
  const days = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days[key] = { date: key, label: getWeekLabel(key), Positive: 0, Negative: 0, Mixed: 0 };
  }
  reviews.forEach((r) => {
    const key = new Date(r.review_time).toISOString().slice(0, 10);
    if (days[key] && r.sentiment) {
      const s = r.sentiment.charAt(0).toUpperCase() + r.sentiment.slice(1).toLowerCase();
      if (s in days[key]) days[key][s] += 1;
    }
  });
  return Object.values(days);
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="tooltip-label">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="tooltip-row">
          <span className="tooltip-dot" style={{ background: p.color }} />
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

export default function SentimentChart({ reviews }) {
  const data = buildChartData(reviews);

  return (
    <div className="chart-card">
      <div className="section-header">
        <h2 className="section-title">
          <span className="section-title-dot" />
          Weekly Sentiment Trends
        </h2>
      </div>

      <div className="chart-legend">
        {[
          { label: 'Positive', color: '#5EBF7A' },
          { label: 'Negative', color: '#E06C68' },
          { label: 'Mixed',    color: '#D4A640' },
        ].map(({ label, color }) => (
          <span key={label} className="legend-item">
            <span className="legend-dot" style={{ background: color }} /> {label}
          </span>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 6, right: 16, left: -22, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="#ede8e0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#7A5540', fontFamily: 'Plus Jakarta Sans' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#7A5540', fontFamily: 'Plus Jakarta Sans' }}
            axisLine={false} tickLine={false} allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="Positive" name="Positive" stroke="#5EBF7A" strokeWidth={2.5}
            dot={{ fill: '#5EBF7A', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="Negative" name="Negative" stroke="#E06C68" strokeWidth={2.5}
            dot={{ fill: '#E06C68', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
          <Line type="monotone" dataKey="Mixed" name="Mixed" stroke="#D4A640" strokeWidth={2.5}
            strokeDasharray="5 3" dot={{ fill: '#D4A640', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
