import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../../../components/common/Button/Button';
import { PageContainer } from '../../../components/layout/PageContainer';
import { LibrarianLayout } from '../../../layouts/LibrarianLayout';
import { signalRClient } from '../../../services/realtime/signalRClient';
import { armRuntime, cancelNavigationGoal, disarmRuntime, getRobotRuntimes, sendNavigationGoal, setInitialPose } from '../api/runtimeApi';
import { OperationsMap2D } from '../components/OperationsMap2D';
import { RobotScene3D } from '../components/RobotScene3D';
import { OccupancyMapMetadata, Pose2D, RobotRuntime } from '../types/runtime';

type SelectionMode = 'INITIAL_POSE' | 'GOAL';

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : 'Không thể thực hiện yêu cầu.';
}
export function MapDemoPage() {
  const [map, setMap] = useState<OccupancyMapMetadata | null>(null);
  const [runtimes, setRuntimes] = useState<RobotRuntime[]>([]);
  const [runtimeId, setRuntimeId] = useState('sim');
  const [runtime, setRuntime] = useState<RobotRuntime | null>(null);
  const [leaseId, setLeaseId] = useState<string | null>(null);
  const [mode, setMode] = useState<SelectionMode>('GOAL');
  const [draft, setDraft] = useState<Pose2D | null>(null);
  const [view, setView] = useState<'SPLIT' | '2D' | '3D'>('SPLIT');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const refreshRuntimes = useCallback(async () => {
    try {
      const next = await getRobotRuntimes();
      setRuntimes(next);
      setRuntime(next.find((item) => item.id === runtimeId) ?? null);
    } catch (error) {
      setNotice(messageOf(error));
    }
  }, [runtimeId]);

  useEffect(() => {
    fetch('/maps/library-map.json').then((response) => response.json()).then(setMap).catch((error) => setNotice(messageOf(error)));
  }, []);

  useEffect(() => {
    void refreshRuntimes();
    const timer = window.setInterval(refreshRuntimes, 2000);
    return () => window.clearInterval(timer);
  }, [refreshRuntimes]);

  useEffect(() => {
    void signalRClient.subscribeRuntime(runtimeId);
    const unsubscribe = signalRClient.subscribe<RobotRuntime>('RobotTelemetryUpdated', (payload) => {
      if (payload.id === runtimeId) setRuntime(payload);
    });
    return () => {
      unsubscribe();
      void signalRClient.unsubscribeRuntime(runtimeId);
    };
  }, [runtimeId]);

  useEffect(() => {
    if (!leaseId) return;
    const disarmOnExit = () => {
      void fetch(`/api/robot-runtimes/${runtimeId}/arm`, { method: 'DELETE', keepalive: true });
    };
    window.addEventListener('beforeunload', disarmOnExit);
    return () => window.removeEventListener('beforeunload', disarmOnExit);
  }, [leaseId, runtimeId]);

  const telemetry = runtime?.telemetry;
  const localized = telemetry?.localizationState === 'LOCALIZED';
  const isReal = runtime?.kind === 'REAL';
  const isSim = runtime?.kind === 'SIM';
  const isNavigating = ['SENDING', 'NAVIGATING', 'CANCELING'].includes(telemetry?.navigationState ?? '');
  const canSelect = Boolean(map && runtime?.connected && !runtime.stale && !busy);
  const canSendGoal = Boolean(canSelect && localized && draft && (!isReal || (runtime?.armed && leaseId)) && !isNavigating);
  const stateTone = runtime?.connected && !runtime.stale ? 'success' : 'danger';

  const statusText = useMemo(() => {
    if (!runtime) return 'Không có runtime';
    if (!runtime.connected || runtime.stale) return 'Mất kết nối';
    return telemetry?.navigationState ?? 'IDLE';
  }, [runtime, telemetry]);

  const selectRuntime = async (nextId: string) => {
    if (runtime?.kind === 'REAL' && runtime.armed) {
      try { await disarmRuntime(runtime.id); } catch { /* stale disarm is safe to ignore */ }
    }
    setRuntimeId(nextId);
    if (runtimes.find((item) => item.id === nextId)?.kind === 'SIM') setMode('GOAL');
    setLeaseId(null);
    setDraft(null);
    setNotice(null);
  };

  const handleArm = async () => {
    setBusy(true); setNotice(null);
    try {
      const lease = await armRuntime(runtimeId);
      setLeaseId(lease.leaseId);
      await refreshRuntimes();
      setNotice(`Đã arm robot thật đến ${new Date(lease.expiresAt).toLocaleTimeString()}.`);
    } catch (error) { setNotice(messageOf(error)); }
    finally { setBusy(false); }
  };

  const handleDisarm = async () => {
    setBusy(true);
    try { await disarmRuntime(runtimeId); setLeaseId(null); await refreshRuntimes(); setNotice('Đã khóa điều khiển robot thật.'); }
    catch (error) { setNotice(messageOf(error)); }
    finally { setBusy(false); }
  };

  const confirmDraft = async () => {
    if (!draft) return;
    setBusy(true); setNotice(null);
    try {
      if (mode === 'INITIAL_POSE') {
        await setInitialPose(runtimeId, draft, leaseId);
        setNotice('Đã gửi vị trí ban đầu. Đang chờ AMCL định vị.');
      } else {
        const goal = await sendNavigationGoal(runtimeId, draft, leaseId);
        setNotice(`Nav2 đã nhận goal ${goal.commandId.slice(0, 8)}.`);
      }
      setDraft(null);
    } catch (error) { setNotice(messageOf(error)); }
    finally { setBusy(false); }
  };

  const stopRobot = async () => {
    const commandId = telemetry?.activeGoalId;
    if (!commandId) return;
    setBusy(true); setNotice(null);
    try { await cancelNavigationGoal(runtimeId, commandId, leaseId); setNotice('Đã gửi yêu cầu dừng điều hướng.'); }
    catch (error) { setNotice(messageOf(error)); }
    finally { setBusy(false); }
  };

  return (
    <LibrarianLayout>
      <PageContainer>
        <div className="operations-page">
          <header className="operations-header">
            <div><p className="eyebrow">LiBot Control Center</p><h1>Giám sát và điều hướng</h1><p>Gazebo và robot thật dùng chung một bản đồ, một luồng telemetry.</p></div>
            <div className={`status-badge ${stateTone}`}><span className="status-light" />{statusText}</div>
          </header>

          <section className="operations-toolbar">
            <div className="runtime-tabs" aria-label="Chọn robot runtime">
              {runtimes.map((item) => <button key={item.id} className={runtimeId === item.id ? 'active' : ''} onClick={() => void selectRuntime(item.id)}>
                <span>{item.kind}</span>{item.displayName}
              </button>)}
            </div>
            <div className="view-tabs">
              {(['SPLIT', '2D', '3D'] as const).map((item) => <button key={item} className={view === item ? 'active' : ''} onClick={() => setView(item)}>{item}</button>)}
            </div>
          </section>

          <div className="operations-layout">
            <aside className="operations-sidebar">
              <div className="control-card"><h3>Trạng thái robot</h3>
                <dl className="telemetry-list">
                  <div><dt>Kết nối</dt><dd>{runtime?.connected && !runtime.stale ? 'Online' : 'Offline'}</dd></div>
                  <div><dt>Định vị</dt><dd>{telemetry?.localizationState ?? 'UNKNOWN'}</dd></div>
                  <div><dt>Điều hướng</dt><dd>{telemetry?.navigationState ?? 'IDLE'}</dd></div>
                  <div><dt>Pin</dt><dd>{telemetry?.battery == null ? '—' : `${telemetry.battery.toFixed(0)}%`}</dd></div>
                  <div><dt>Pose</dt><dd>{telemetry ? `${telemetry.pose.x.toFixed(2)}, ${telemetry.pose.y.toFixed(2)}` : '—'}</dd></div>
                </dl>
              </div>

              {isReal && <div className="control-card safety-card"><h3>Khóa an toàn REAL</h3><p>Arm chỉ có hiệu lực 5 phút và tự hủy khi đổi runtime.</p>
                {runtime?.armed && leaseId ? <Button variant="ghost" onClick={() => void handleDisarm()} disabled={busy}>Disarm</Button> : <Button variant="primary" onClick={() => void handleArm()} disabled={!runtime?.connected || busy}>Arm robot thật</Button>}
              </div>}

              <div className="control-card"><h3>Công cụ bản đồ</h3>
                <div className="mode-switch"><button disabled={isSim} title={isSim ? 'SIM lấy vị trí trực tiếp từ Gazebo.' : undefined} className={mode === 'INITIAL_POSE' ? 'active' : ''} onClick={() => { setMode('INITIAL_POSE'); setDraft(null); }}>Đặt vị trí đầu</button><button className={mode === 'GOAL' ? 'active' : ''} onClick={() => { setMode('GOAL'); setDraft(null); }}>Chọn điểm đến</button></div>
                <p className="helper-text">{isSim ? 'SIM tự lấy vị trí thật từ Gazebo. Chỉ cần chọn điểm đến.' : 'Bấm để chọn vị trí, kéo chuột để đặt hướng robot.'}</p>
                {draft && <div className="draft-pose"><strong>Điểm đã chọn</strong><span>X {draft.x.toFixed(2)} m</span><span>Y {draft.y.toFixed(2)} m</span><span>Yaw {(draft.yaw * 180 / Math.PI).toFixed(0)}°</span></div>}
                <Button variant="primary" disabled={mode === 'GOAL' ? !canSendGoal : !canSelect || !draft || (isReal && (!runtime?.armed || !leaseId))} onClick={() => void confirmDraft()}>{mode === 'GOAL' ? 'Xác nhận di chuyển' : 'Xác nhận initial pose'}</Button>
              </div>

              <button className="stop-button" disabled={!telemetry?.activeGoalId || busy} onClick={() => void stopRobot()}>Dừng điều hướng</button>
              <p className="safety-note">Không thay thế nút dừng khẩn cấp vật lý.</p>
            </aside>

            <main className={`visualization-grid view-${view.toLowerCase()}`}>
              {(view === 'SPLIT' || view === '2D') && <section className="visual-panel"><div className="visual-title"><span>Bản đồ SLAM</span><small>Đơn vị mét · 0,05 m/pixel</small></div>{map ? <OperationsMap2D map={map} robot={telemetry?.pose} draft={draft} path={telemetry?.plannedPath} onDraftChange={setDraft} /> : <div className="visual-loading">Đang tải bản đồ…</div>}</section>}
              {(view === 'SPLIT' || view === '3D') && <section className="visual-panel"><div className="visual-title"><span>Digital twin 3D</span><small>Kéo để xoay · cuộn để zoom</small></div>{map ? <RobotScene3D map={map} robot={telemetry?.pose} draft={draft} path={telemetry?.plannedPath} /> : <div className="visual-loading">Đang dựng scene…</div>}</section>}
            </main>
          </div>
          {notice && <div className="operations-notice" role="status">{notice}</div>}
          {telemetry?.error && <div className="operations-error" role="alert">{telemetry.error}</div>}
        </div>
      </PageContainer>
    </LibrarianLayout>
  );
}
