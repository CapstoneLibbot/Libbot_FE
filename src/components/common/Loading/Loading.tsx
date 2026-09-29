export function Loading({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="empty-state">
      <div>{label}</div>
    </div>
  );
}
