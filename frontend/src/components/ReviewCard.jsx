/**
 * ReviewCard.jsx — dark mode edition
 * Theme badges are now also clickable to set the theme filter.
 */

function initials(name = '') {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Stars({ rating = 0 }) {
  return (
    <div className="stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`star ${n <= rating ? 'filled' : 'empty'}`}>
          {n <= rating ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
}

function sentimentClass(s) {
  if (!s) return 'mix';
  const l = s.toLowerCase();
  if (l === 'positive') return 'pos';
  if (l === 'negative') return 'neg';
  return 'mix';
}

export default function ReviewCard({ review, onThemeClick }) {
  const { author_name, rating, review_text, review_time, sentiment, themes = [], urgency } = review;
  const sClass = sentimentClass(sentiment);
  const uClass = urgency?.toLowerCase() === 'high' ? 'high' : 'low';

  return (
    <div className="review-card">
      <div className="review-header">
        <div className="review-author-row">
          <div className="author-avatar">{initials(author_name)}</div>
          <div className="author-info">
            <div className="author-name">{author_name}</div>
            <div className="review-date">{formatDate(review_time)}</div>
          </div>
        </div>

        <div className="review-meta">
          <Stars rating={rating} />
          <span className={`sentiment-badge ${sClass}`}>{sentiment ?? 'Mixed'}</span>
          {urgency && (
            <span className={`urgency-badge ${uClass}`}>
              {uClass === 'high' ? '🔴' : '🟢'} {urgency}
            </span>
          )}
        </div>
      </div>

      {review_text && (
        <blockquote className="review-text">"{review_text}"</blockquote>
      )}

      {themes.length > 0 && (
        <div className="themes-row">
          {themes.map((theme) => (
            <span
              key={theme}
              className={`theme-badge ${sClass}`}
              style={{ cursor: onThemeClick ? 'pointer' : 'default' }}
              onClick={() => onThemeClick?.(theme)}
              title={onThemeClick ? `Filter by theme: ${theme}` : theme}
            >
              🏷 {theme}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
