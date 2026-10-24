import { PointerEvent, useCallback, useEffect, useRef, useState } from 'react';
import { LibrarianLayout } from '../../../layouts/LibrarianLayout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { armRuntime, disarmRuntime, getLatestRobotMapGrid, getRobotRuntimes, getSavedMaps, getSavedRobotMapGrid, saveRobotMap, sendManualVelocity, setMapping, startNavigationMode, stopManual, stopNavigationMode } from '../api/runtimeApi';
import { LiveOccupancyMap } from '../components/LiveOccupancyMap';
import { RealtimeCamera } from '../components/RealtimeCamera';
import { LiveOccupancyGrid, RobotRuntime, SavedMap } from '../types/runtime';
import { signalRClient } from '../../../services/realtime/signalRClient';
import { axiosClient } from '../../../services/api/axiosClient';

const RUNTIME_ID = 'real';
const HELD_KEYS = new Set(['w', 's', 'a', 'd', 'q', 'e']);

function messageOf(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown; detail?: unknown; title?: unknown } } }).response;
    if (typeof response?.data?.detail === 'string') return response.data.detail;
    if (typeof response?.data?.message === 'string') return response.data.message;
    if (typeof response?.data?.title === 'string') return response.data.title;
  }
  return error instanceof Error ? error.message : 'Không thể thực hiện yêu cầu.';
}

export function RobotMappingPage() {
  const [runtime, setRuntime] = useState<RobotRuntime | null>(null);
  const [grid, setGrid] = useState<LiveOccupancyGrid | null>(null);
  const [leaseId, setLeaseId] = useState<string | null>(null);
  const [speed, setSpeed] = useState(0.1);
  const [maps, setMaps] = useState<SavedMap[]>([]);
  const [selectedMap, setSelectedMap] = useState('');
  const [mapName, setMapName] = useState('LiBot map');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const held = useRef(new Set<string>());
  const manualStopInFlight = useRef(false);
  const leaseRef = useRef<string | null>(null);
  const runtimeRef = useRef<RobotRuntime | null>(null);
  const latestMapIdRef = useRef<string | null>(null);
  const navigationRestartPending = useRef(false);
  const lastTelemetryAt = useRef(0);

  const refresh = useCallback(async () => {
    try {
      const all = await getRobotRuntimes();
      const real = all.find((item) => item.id.toLowerCase() === RUNTIME_ID) ?? null;
      runtimeRef.current = real;
      setRuntime(real);
      if (real?.lastTelemetryAt) lastTelemetryAt.current = Date.parse(real.lastTelemetryAt);
    } catch (error) { setNotice(messageOf(error)); }
  }, []);

  const refreshMaps = useCallback(async () => {
    try {
      const next = await getSavedMaps();
      const saved = next.filter((item) => item.data?.format === 'occupancy-grid-v1');
      const previousLatestId = latestMapIdRef.current;
      const latestId = saved[0]?.id ?? null;
      latestMapIdRef.current = latestId;
      setMaps(saved);
      setSelectedMap((current) => {
        if (!latestId) return '';
        return !current || current === previousLatestId || !saved.some((item) => item.id === current)
          ? latestId
          : current;
      });
    } catch (error) { setNotice(messageOf(error)); }
  }, []);

  const stop = useCallback(async (resumeNavigation = true) => {
    held.current.clear();
    if (manualStopInFlight.current) return;
    manualStopInFlight.current = true;
    const shouldReportRestart = resumeNavigation && navigationRestartPending.current;
    try {
      const result = await stopManual(RUNTIME_ID, resumeNavigation);
      if (shouldReportRestart) {
        navigationRestartPending.current = false;
        await refresh();
        setNotice(result.navigation_restarted
          ? 'Đã dừng điều khiển tay và khởi động lại Nav2.'
          : 'Đã dừng điều khiển tay. Nav2 chưa được khởi động lại; hãy kiểm tra map và log robot.');
      }
    } catch (error) {
      if (shouldReportRestart) setNotice(messageOf(error));
    } finally {
      manualStopInFlight.current = false;
    }
  }, [refresh]);

  useEffect(() => {
    void refresh();
    void refreshMaps();
    const timer = window.setInterval(() => { void refresh(); }, 1500);
    const mapsTimer = window.setInterval(() => { void refreshMaps(); }, 5000);
    void signalRClient.subscribeRuntime(RUNTIME_ID);
    const removeMap = signalRClient.subscribe<LiveOccupancyGrid>('RobotMapUpdated', setGrid);
    const stopOnExit = () => {
      const baseUrl = axiosClient.defaults.baseURL ?? '/api';
      const apiUrl = (path: string) => new URL(`${baseUrl.replace(/\/$/, '')}${path}`, window.location.href);
      void fetch(apiUrl('/robot-runtimes/real/manual-stop?resumeNavigation=true'), { method: 'POST', keepalive: true });
      if (leaseRef.current) void fetch(apiUrl('/robot-runtimes/real/arm'), { method: 'DELETE', keepalive: true });
    };
    window.addEventListener('pagehide', stopOnExit);
    const removeTelemetry = signalRClient.subscribe<RobotRuntime>('RobotTelemetryUpdated', (payload) => {
      if (payload.id.toLowerCase() === RUNTIME_ID) {
        runtimeRef.current = payload;
        setRuntime(payload);
        if (payload.lastTelemetryAt) lastTelemetryAt.current = Date.parse(payload.lastTelemetryAt);
      }
    });
    return () => {
      window.clearInterval(timer);
      window.clearInterval(mapsTimer);
      removeMap(); removeTelemetry();
      window.removeEventListener('pagehide', stopOnExit);
      void signalRClient.unsubscribeRuntime(RUNTIME_ID);
      void stop();
      if (leaseRef.current) void disarmRuntime(RUNTIME_ID);
    };
  }, [refresh, refreshMaps, stop]);

  useEffect(() => {
    if (grid) return;
    let active = true;
    const loadLatestMap = async () => {
      try {
        const latest = await getLatestRobotMapGrid();
        if (active && latest) setGrid(latest);
      } catch {
        // SignalR remains the primary stream; retry REST while no map has arrived yet.
      }
    };
    void loadLatestMap();
    const timer = window.setInterval(() => { void loadLatestMap(); }, 2000);
    return () => { active = false; window.clearInterval(timer); };
  }, [grid]);

  useEffect(() => {
    const release = () => { void stop(); };
    const keyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      const key = event.key.toLowerCase();
      if (HELD_KEYS.has(key)) { event.preventDefault(); held.current.add(key); }
      if (event.code === 'Space') { event.preventDefault(); void stop(); }
    };
    const keyUp = (event: KeyboardEvent) => {
      held.current.delete(event.key.toLowerCase());
      if (held.current.size === 0) void stop();
    };
    window.addEventListener('blur', release);
    window.addEventListener('keydown', keyDown as EventListener);
    window.addEventListener('keyup', keyUp as EventListener);
    document.addEventListener('visibilitychange', release);
    return () => {
      window.removeEventListener('blur', release);
      window.removeEventListener('keydown', keyDown as EventListener);
      window.removeEventListener('keyup', keyUp as EventListener);
      document.removeEventListener('visibilitychange', release);
    };
  }, [stop]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = runtimeRef.current;
      const lease = leaseRef.current;
      const connected = Boolean(current?.connected && !current.stale && Date.now() - lastTelemetryAt.current < 3000);
      if (!connected || !lease || current?.navigationActive || held.current.size === 0) {
        if (!connected && held.current.size) void stop();
        return;
      }
      const keys = held.current;
      const velocity = {
        linearX: (Number(keys.has('w')) - Number(keys.has('s'))) * speed,
        linearY: (Number(keys.has('a')) - Number(keys.has('d'))) * speed,
        angularZ: (Number(keys.has('q')) - Number(keys.has('e'))) * Math.min(0.5, speed * 2.5),
      };
      void sendManualVelocity(RUNTIME_ID, velocity, lease).catch((error) => {
        setNotice(messageOf(error));
        void stop();
      });
    }, 100);
    return () => window.clearInterval(timer);
  }, [speed, stop]);

  const arm = async () => {
    setBusy(true); setNotice('');
    try {
      const value = await armRuntime(RUNTIME_ID);
      leaseRef.current = value.leaseId;
      setLeaseId(value.leaseId);
      await refresh();
      setNotice('Đã mở khóa điều khiển robot thật.');
    } catch (error) { setNotice(messageOf(error)); }
    finally { setBusy(false); }
  };

  const disarm = async () => {
    setBusy(true); await stop();
    try { await disarmRuntime(RUNTIME_ID); leaseRef.current = null; setLeaseId(null); await refresh(); setNotice('Đã khóa điều khiển.'); }
    catch (error) { setNotice(messageOf(error)); }
    finally { setBusy(false); }
  };

  const toggleMapping = async (enabled: boolean) => {
    if (enabled && !leaseId) return;
    setBusy(true); await stop(false);
    try { await setMapping(RUNTIME_ID, enabled, leaseId); if (enabled) navigationRestartPending.current = false; await refresh(); setNotice(enabled ? 'Đang mapping trực tiếp.' : 'Đã dừng mapping.'); }
    catch (error) { setNotice(messageOf(error)); }
    finally { setBusy(false); }
  };

  const saveMap = async () => {
    if (!leaseId || !mapName.trim()) return;
    setBusy(true); setNotice('Đang lưu PGM/YAML trên robot và snapshot vào database…');
    try {
      const saved = await saveRobotMap(mapName.trim(), leaseId);
      setMaps((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setSelectedMap(saved.id);
      await setMapping(RUNTIME_ID, false, leaseId);
      await refreshMaps();
      setGrid(await getSavedRobotMapGrid(saved.id));
      await refresh();
      setNotice(`Đã lưu “${saved.name}” phiên bản ${saved.version}; đã dừng SLAM để sẵn sàng khởi chạy Nav2.`);
    } catch (error) { setNotice(messageOf(error)); }
    finally { setBusy(false); }
  };

  const startNav = async () => {
    if (!leaseId || !selectedMap) return;
    setBusy(true); await stop(false);
    try { await startNavigationMode(selectedMap, leaseId); navigationRestartPending.current = false; await refresh(); setNotice('Nav2 đã khởi động với map đã chọn. Dừng Nav2 trước khi điều khiển thủ công.'); }
    catch (error) { setNotice(messageOf(error)); }
    finally { setBusy(false); }
  };

  const stopNav = async () => {
    setBusy(true); await stop(false);
    try { await stopNavigationMode(); navigationRestartPending.current = true; await refresh(); setNotice('Đã dừng Nav2. Nav2 sẽ tự khởi động lại khi bạn dừng điều khiển tay.'); }
    catch (error) { setNotice(messageOf(error)); }
    finally { setBusy(false); }
  };

  const pointerDown = (event: PointerEvent<HTMLButtonElement>, key: string) => { event.preventDefault(); held.current.add(key); event.currentTarget.setPointerCapture(event.pointerId); };
  const pointerUp = (key: string) => { held.current.delete(key); if (held.current.size === 0) void stop(); };
  const connected = Boolean(runtime?.connected && !runtime.stale);
  const navActive = Boolean(runtime?.navigationActive);
  const mapPose = runtime?.telemetry?.pose;
  const heldButton = (key: string, label: string, wide = false) => <button type="button" className={`manual-key ${wide ? 'wide' : ''}`} disabled={!leaseId || !connected || navActive} onPointerDown={(event) => pointerDown(event, key)} onPointerUp={() => pointerUp(key)} onPointerCancel={() => pointerUp(key)} onLostPointerCapture={() => pointerUp(key)}>{label}</button>;

  return <LibrarianLayout><PageContainer>
    <div className="robot-mapping-page">
      <header className="robot-mapping-header"><div><span className="robot-mapping-eyebrow">LiBot · ROBOT THẬT</span><h1>Điều khiển và tạo bản đồ</h1><p>Map chỉ được lưu khi bạn chủ động bấm “Lưu map”.</p></div><span className={`robot-live-status ${connected ? 'online' : 'offline'}`}>{connected ? 'ĐANG KẾT NỐI' : 'MẤT KẾT NỐI'}</span></header>
      <div className="robot-mapping-grid">
        <section className="robot-map-panel"><div className="robot-panel-heading"><div><h2>Map trực tiếp</h2><span>{grid ? `Cập nhật ${new Date(grid.timestamp).toLocaleTimeString()}` : 'Chờ dữ liệu SLAM'}</span></div><span className={runtime?.mappingActive ? 'mapping-pill active' : 'mapping-pill'}>{runtime?.mappingActive ? 'SLAM ĐANG CHẠY' : navActive ? 'NAV2 ĐANG CHẠY' : 'CHƯA MAPPING'}</span></div>
          <div className="robot-live-workspace">
            <LiveOccupancyMap grid={grid} robot={mapPose} mappingActive={Boolean(runtime?.mappingActive)} />
            <RealtimeCamera runtimeId={RUNTIME_ID} connected={connected} mappingActive={Boolean(runtime?.mappingActive)} />
          </div>
          <div className="robot-pose-readout"><span>Vị trí</span><strong>{mapPose ? `${mapPose.x.toFixed(2)} m, ${mapPose.y.toFixed(2)} m` : '—'}</strong><span>Hướng</span><strong>{mapPose ? `${(mapPose.yaw * 180 / Math.PI).toFixed(0)}°` : '—'}</strong></div>
        </section>
        <aside className="robot-tools-column">
          <section className="robot-control-card"><div className="robot-card-title"><h2>Điều khiển</h2><span>{leaseId ? 'ĐÃ ARM' : 'ĐANG KHÓA'}</span></div>
            {leaseId ? <button className="robot-arm-button armed" onClick={() => void disarm()} disabled={busy}>Khóa robot</button> : <button className="robot-arm-button" onClick={() => void arm()} disabled={!connected || busy}>Mở khóa robot</button>}
            <div className="manual-pad">{heldButton('q', '↶')} {heldButton('w', '↑', true)} {heldButton('e', '↷')} {heldButton('a', '←')} {heldButton('s', '↓')} {heldButton('d', '→')}</div>
            <div className="speed-slider"><label htmlFor="robot-speed">Tốc độ tối đa (m/s) <b>{speed.toFixed(2)}</b></label><input id="robot-speed" type="range" min="0.02" max="0.7" step="0.01" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} /><small>Phím: W/S tiến lùi · A/D ngang · Q/E xoay · Space dừng</small></div>
            <button className="robot-stop-button" disabled={navActive} onClick={() => void stop()}>DỪNG</button>
          </section>
          <section className="robot-control-card"><div className="robot-card-title"><h2>Mapping và lưu</h2></div>
            <div className="robot-action-row"><button className="robot-primary-button" disabled={!leaseId || !connected || navActive || runtime?.mappingActive || busy} onClick={() => void toggleMapping(true)}>Bắt đầu mapping</button><button className="robot-secondary-button" disabled={!runtime?.mappingActive || busy} onClick={() => void toggleMapping(false)}>Dừng</button></div>
            <label className="robot-field">Tên bản đồ<input value={mapName} onChange={(event) => setMapName(event.target.value)} maxLength={120} /></label>
            <button className="robot-save-button" disabled={!leaseId || !grid || !runtime?.mappingActive || !mapName.trim() || busy} onClick={() => void saveMap()}>Lưu map vào robot và database</button>
          </section>
          <section className="robot-control-card"><div className="robot-card-title"><h2>Nav2</h2></div>
            <select className="robot-map-select" value={selectedMap} onChange={(event) => setSelectedMap(event.target.value)}><option value="">Chọn map đã lưu</option>{maps.map((map) => <option key={map.id} value={map.id}>{map.name} · v{map.version}</option>)}</select>
            {navActive ? <button className="robot-secondary-button full" disabled={busy} onClick={() => void stopNav()}>Dừng Nav2 để điều khiển thủ công</button> : <button className="robot-primary-button full" disabled={!leaseId || !selectedMap || !connected || runtime?.mappingActive || busy} onClick={() => void startNav()}>Khởi chạy Nav2 với map</button>}
          </section>
        </aside>
      </div>
      {notice && <div className="robot-mapping-notice" role="status">{notice}</div>}
      {runtime?.telemetry?.error && <div className="robot-mapping-notice error" role="alert">{runtime.telemetry.error}</div>}
    </div>
  </PageContainer></LibrarianLayout>;
}
