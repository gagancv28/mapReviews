/**
 * NetSentimentScore.jsx
 * Computes NSS = %Positive − %Negative and renders it as a large score.
 * Ranges: ≥ 30 = positive, ≤ −30 = negative, else neutral.
 */

export default function NetSentimentScore({ reviews }) {
  const total = reviews.length || 1;

  const pos = reviews.filter((r) => r.sentiment?.toLowerCase() === 'positive').length;
  const neg = reviews.filter((r) => r.sentiment?.toLowerCase() === 'negative').length;

  const pctPos = Math.round((pos / total) * 100);
  const pctNeg = Math.round((neg / total) * 100);
  const nss    = pctPos - pctNeg;

  const cls    = nss >= 30 ? 'pos' : nss <= -30 ? 'neg' : 'neu';
  const emoji  = nss >= 30 ? '😊' : nss <= -30 ? '😟' : '😐';
  const label  = nss >= 30 ? 'Excellent' : nss <= -30 ? 'Critical' : 'Neutral';

  return (
    <div className="panel-card">
      <div className="panel-card-header">
        <span className="panel-card-title">
          <span className="panel-card-icon">📊</span> Net Sentiment Score
        </span>
      </div>

      <div className="nss-widget">
        <div className="nss-label">NSS = % Positive − % Negative</div>

        <div className={`nss-big ${cls}`}>
          {nss > 0 ? '+' : ''}{nss}
        </div>

        <div style={{ fontSize: 22, marginTop: 4 }}>{emoji}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: `var(--clr-${cls === 'pos' ? 'pos' : cls === 'neg' ? 'neg' : 'mix'})`, marginTop: 2 }}>
          {label}
        </div>

        <div className="nss-formula">
          {pctPos}% Positive &minus; {pctNeg}% Negative = <strong>{nss > 0 ? '+' : ''}{nss}</strong>
        </div>

        <div className="nss-desc" style={{ marginTop: 8 }}>
          Benchmark: &ge;30 is <span style={{ color: 'var(--clr-pos)' }}>great</span>,
          &le;&minus;30 is <span style={{ color: 'var(--clr-neg)' }}>critical</span>
        </div>
      </div>
    </div>
  );
}
