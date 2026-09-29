export function MissionTaskList({ tasks }: { tasks: Array<{ id: string; name: string; status: string }> }) {
  return (
    <ul className="workflow-steps">
      {tasks.map((task) => (
        <li key={task.id} className="workflow-step">
          <span className="dot" />
          <span>{task.name}</span>
          <span className="status-badge info" style={{ marginLeft: 'auto' }}>{task.status}</span>
        </li>
      ))}
    </ul>
  );
}
