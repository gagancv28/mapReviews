/**
 * ThemeBreakdown.jsx
 * Displays AI-extracted themes as:
 *   1. A clickable tag cloud (chips) for quick filter
 *   2. A mini-table with occurrence count + average rating per theme
 * Clicking a theme chip sets activeFilter to 'theme:<ThemeName>'
 */

function starStr(avg) {
  const full  = Math.round(avg);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

export default function ThemeBreakdown({ reviews, activeFilter, setActiveFilter }) {
  // Aggregate themes across all reviews
  const themeMap = {};

  reviews.forEach((r) => {
    (r.themes ?? []).forEach((theme) => {
      if (!themeMap[theme]) themeMap[theme] = { count: 0, ratingSum: 0 };
      themeMap[theme].count    += 1;
      themeMap[theme].ratingSum += (r.rating ?? 0);
    });
  });

  const themes = Object.entries(themeMap)
    .map(([name, d]) => ({
      name,
      count:  d.count,
      avgRating: d.count ? (d.ratingSum / d.count).toFixed(1) : '—',
    }))
    .sort((a, b) => b.count - a.count);

  const activeTheme = activeFilter.startsWith('theme:')
    ? activeFilter.replace('theme:', '')
    : null;

  function toggleTheme(name) {
    const key = `theme:${name}`;
    setActiveFilter(activeFilter === key ? 'all' : key);
  }

  if (themes.length === 0) {
    return (
      <div className="panel-card">
        <div className="panel-card-header">
          <span className="panel-card-title">
            <span className="panel-card-icon">🏷</span> Theme Breakdown
          </span>
        </div>
        <div className="panel-card-body">
          <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>
            No themes extracted yet.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-card">
      <div className="panel-card-header">
        <span className="panel-card-title">
          <span className="panel-card-icon">🏷</span> AI Theme Breakdown
        </span>
        <span className="panel-card-badge info">{themes.length} topics</span>
      </div>

      {/* Tag cloud */}
      <div className="panel-card-body" style={{ paddingBottom: 12 }}>
        <div className="theme-cloud">
          {themes.map(({ name, count }) => (
            <button
              key={name}
              className={`theme-chip${activeTheme === name ? ' active' : ''}`}
              onClick={() => toggleTheme(name)}
              title={`Filter reviews mentioning "${name}"`}
            >
              {name}
              <span className="theme-chip-count">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mini-table */}
      <div style={{ borderTop: '1px solid var(--clr-border)' }}>
        <table className="theme-table">
          <thead>
            <tr>
              <th>Theme</th>
              <th style={{ textAlign: 'center' }}>Count</th>
              <th style={{ textAlign: 'right' }}>Avg ★</th>
            </tr>
          </thead>
          <tbody>
            {themes.map(({ name, count, avgRating }) => (
              <tr
                key={name}
                className={activeTheme === name ? 'active-row' : ''}
                onClick={() => toggleTheme(name)}
              >
                <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12 }}>
                  {name}
                </td>
                <td style={{ textAlign: 'center' }}>{count}</td>
                <td style={{ textAlign: 'right' }}>
                  <span className="theme-avg-stars">{starStr(parseFloat(avgRating))}</span>
                  <span style={{ marginLeft: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                    {avgRating}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
