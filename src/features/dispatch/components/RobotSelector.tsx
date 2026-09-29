export function RobotSelector({ robots, value, onChange }: { robots: Array<{ id: string; name: string; status: string; battery: number }>; value: string; onChange: (robotId: string) => void }) {
  return (
    <div className="form-row">
      <label className="field-label">Robot</label>
      <select className="field-select" value={value} onChange={(event) => onChange(event.target.value)}>
        {robots.map((robot) => (
          <option key={robot.id} value={robot.id}>{robot.name}</option>
        ))}
      </select>
    </div>
  );
}
