export function DispatchTimeline({ steps }: { steps: Array<{ id: string; name: string; sequence: number }> }) {
  return (
    <div className="timeline">
      {steps.map((step) => (
        <div key={step.id} className="timeline-item done">{step.name}</div>
      ))}
    </div>
  );
}
