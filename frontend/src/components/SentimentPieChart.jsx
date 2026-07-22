/**
 * SentimentPieChart.jsx
 * Interactive donut chart — clicking a slice filters the review list below.
 * Uses Recharts PieChart with Cell-level onClick and visual active-state.
 */

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';

const SLICES = [
  { key: 'positive', label: 'Positive', color: '#5EBF7A', glow: 'rgba(94,191,122,.30)' },
  { key: 'negative', label: 'Negative', color: '#E06C68', glow: 'rgba(224,108,104,.30)' },
  { key: 'mixed',    label: 'Mixed',    color: '#D4A640', glow: 'rgba(212,166,64,.25)' },
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="custom-tooltip">
      <div className="tooltip-label">{d.name}</div>
      <div className="tooltip-row">
        <span className="tooltip-dot" style={{ background: d.payload.color }} />
        {d.value} review{d.value !== 1 ? 's' : ''} &nbsp;
        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
          ({Math.round(d.payload.percent * 100)}%)
        </span>
      </div>
    </div>
  );
}

export default function SentimentPieChart({ reviews, activeFilter, setActiveFilter }) {
  // Count per sentiment
  const counts = reviews.reduce(
    (acc, r) => {
      const s = (r.sentiment ?? 'mixed').toLowerCase();
      if (s in acc) acc[s] += 1;
      return acc;
    },
    { positive: 0, negative: 0, mixed: 0 }
  );

  const total = reviews.length || 1; // avoid div/0 in percent

  const pieData = SLICES.map((s) => ({
    name:    s.label,
    key:     s.key,
    value:   counts[s.key],
    color:   s.color,
    percent: counts[s.key] / total,
  })).filter((d) => d.value > 0);   // hide zero-count slices

  function toggleFilter(key) {
    setActiveFilter(activeFilter === key ? 'all' : key);
  }

  const isSentimentFilter = ['positive', 'negative', 'mixed'].includes(activeFilter);

  return (
    <div className="chart-card">
      <div className="section-header">
        <h2 className="section-title">
          <span className="section-title-dot" />
          Sentiment Distribution
        </h2>
        <span className="section-badge">{reviews.length} total</span>
      </div>

      <div className="pie-container">
        {/* Donut */}
        <ResponsiveContainer width={220} height={220} minWidth={180}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              cursor="pointer"
              onClick={(data) => toggleFilter(data.key)}
            >
              {pieData.map((entry) => {
                const isActive   = activeFilter === entry.key;
                const isDimmed   = isSentimentFilter && !isActive;
                return (
                  <Cell
                    key={entry.key}
                    fill={entry.color}
                    opacity={isDimmed ? 0.3 : 1}
                    stroke={isActive ? entry.color : 'transparent'}
                    strokeWidth={isActive ? 3 : 0}
                    style={{
                      filter: isActive ? `drop-shadow(0 0 8px ${entry.color})` : 'none',
                      cursor: 'pointer',
                      transition: 'opacity .25s, filter .25s',
                    }}
                  />
                );
              })}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Side stats — also clickable */}
        <div className="pie-stats">
          {SLICES.map((s) => (
            <div
              key={s.key}
              className={`pie-stat-row${activeFilter === s.key ? ' active-filter' : ''}`}
              onClick={() => toggleFilter(s.key)}
              style={{ cursor: 'pointer' }}
              title={`Click to filter by ${s.label}`}
            >
              <span className="pie-stat-label">
                <span className="pie-stat-dot" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="pie-stat-count">
                {counts[s.key]}
                <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: 11, marginLeft: 4 }}>
                  ({Math.round((counts[s.key] / total) * 100)}%)
                </span>
              </span>
            </div>
          ))}
          <div className="chart-hint">
            👆 Click a slice or row to filter
          </div>
        </div>
      </div>
    </div>
  );
}
