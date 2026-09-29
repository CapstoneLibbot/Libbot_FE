export function MapLegend() {
  return (
    <div className="map-legend">
      <div className="legend-item"><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#2563eb', display: 'block' }} /> Robot</div>
      <div className="legend-item"><span style={{ width: 12, height: 12, background: '#93c5fd', display: 'block' }} /> Shelf</div>
      <div className="legend-item"><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#fbbf24', display: 'block' }} /> Waypoint</div>
      <div className="legend-item"><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#16a34a', display: 'block' }} /> Start</div>
      <div className="legend-item"><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#dc2626', display: 'block' }} /> Goal</div>
    </div>
  );
}
