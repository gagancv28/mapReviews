/**
 * MetricCard.jsx
 * A single KPI card with an icon, label, and primary value.
 * Optionally renders a sentiment breakdown bar chart.
 */

export default function MetricCard({ icon, iconClass, label, value, sub, children }) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${iconClass}`}>{icon}</div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
      {children}
    </div>
  );
}
