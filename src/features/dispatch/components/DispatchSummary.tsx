export function DispatchSummary({ distance, duration }: { distance: number; duration: number }) {
  return (
    <div className="metric-grid">
      <div className="metric-card">
        <div className="metric-label">Distance</div>
        <div className="metric-value">{distance.toFixed(1)} m</div>
      </div>
      <div className="metric-card">
        <div className="metric-label">Duration</div>
        <div className="metric-value">{duration}s</div>
      </div>
    </div>
  );
}
