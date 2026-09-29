export function MissionStatus({ status }: { status: string }) {
  const key = status.toLowerCase();
  const tone = key.includes('fail') || key.includes('cancel') ? 'danger' : key.includes('run') || key.includes('queue') ? 'warning' : key.includes('complete') ? 'success' : 'info';

  return <span className={`status-badge ${tone}`}>{status}</span>;
}
