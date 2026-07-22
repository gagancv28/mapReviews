/**
 * UrgencyQueue.jsx
 * Pulls every review where urgency === 'High' and renders them as
 * a critical alert feed so business owners can triage immediately.
 */

export default function UrgencyQueue({ reviews }) {
  const highUrgency = reviews.filter(
    (r) => r.urgency?.toLowerCase() === 'high'
  );

  return (
    <div className="panel-card">
      <div className="panel-card-header">
        <span className="panel-card-title">
          <span className="panel-card-icon">🚨</span> Urgency Action Queue
        </span>
        {highUrgency.length > 0 && (
          <span className="panel-card-badge high">
            {highUrgency.length} alert{highUrgency.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="panel-card-body">
        {highUrgency.length === 0 ? (
          <div className="urgency-empty">
            <span className="urgency-empty-icon">✅</span>
            <span>No high-urgency reviews detected.</span>
          </div>
        ) : (
          <div className="urgency-feed">
            {highUrgency.map((r, i) => (
              <div key={r.id ?? i} className="urgency-item">
                <span className="urgency-icon">🔴</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="urgency-author">{r.author_name}</div>
                  <div className="urgency-snippet">
                    {(r.review_text ?? '').slice(0, 100)}
                    {(r.review_text ?? '').length > 100 ? '…' : ''}
                  </div>
                  <div className="urgency-rating">
                    {'★'.repeat(r.rating ?? 0)}{'☆'.repeat(5 - (r.rating ?? 0))}
                    &nbsp;·&nbsp;
                    {(r.themes ?? []).slice(0, 2).join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
