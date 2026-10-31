import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bot,
  CheckCircle2,
  Gauge,
  Lock,
  Map as MapIcon,
  Navigation,
  Power,
  RotateCcw,
  RotateCw,
  Save,
  ShieldCheck,
  Square,
  Unlock,
} from 'lucide-react'
import { Link } from 'react-router'

import LiveOccupancyMap from '../../features/maps/components/LiveOccupancyMap'
import RealtimeCamera from '../../features/maps/components/RealtimeCamera'
import {
  apiClient,
  armRuntime,
  disarmRuntime,
  getLatestRobotMapGrid,
  getRobotRuntimes,
  getSavedMaps,
  getSavedRobotMapGrid,
  saveRobotMap,
  sendManualVelocity,
  setMapping,
  startNavigationMode,
  stopManual,
  stopNavigationMode,
} from '../../features/maps/api/runtimeApi'
import { signalRClient } from '../../features/maps/services/signalRClient'
import type {
  LiveOccupancyGrid,
  RobotRuntime,
  SavedMap,
} from '../../features/maps/types/runtime'

const RUNTIME_ID = 'real'
const HELD_KEYS = new Set(['w', 's', 'a', 'd', 'q', 'e'])

function messageOf(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: unknown
            detail?: unknown
            title?: unknown
          }
        }
      }
    ).response

    if (typeof response?.data?.detail === 'string') {
      return response.data.detail
    }

    if (typeof response?.data?.message === 'string') {
      return response.data.message
    }

    if (typeof response?.data?.title === 'string') {
      return response.data.title
    }
  }

  return error instanceof Error
    ? error.message
    : 'Không thể thực hiện yêu cầu.'
}

function CreateMap() {
  const [runtime, setRuntime] = useState<RobotRuntime | null>(null)
  const [grid, setGrid] = useState<LiveOccupancyGrid | null>(null)
  const [leaseId, setLeaseId] = useState<string | null>(null)
  const [speed, setSpeed] = useState(0.1)
  const [maps, setMaps] = useState<SavedMap[]>([])
  const [selectedMap, setSelectedMap] = useState('')
  const [mapName, setMapName] = useState('LiBot map')
  const [notice, setNotice] = useState('')
  const [noticeTone, setNoticeTone] = useState<'info' | 'success' | 'error'>('info')
  const [busy, setBusy] = useState(false)

  const held = useRef(new Set<string>())
  const manualStopInFlight = useRef(false)
  const leaseRef = useRef<string | null>(null)
  const runtimeRef = useRef<RobotRuntime | null>(null)
  const latestMapIdRef = useRef<string | null>(null)
  const navigationRestartPending = useRef(false)
  const lastTelemetryAt = useRef(0)

  const showNotice = useCallback(
    (message: string, tone: 'info' | 'success' | 'error' = 'info') => {
      setNotice(message)
      setNoticeTone(tone)
    },
    [],
  )

  const refresh = useCallback(async () => {
    try {
      const all = await getRobotRuntimes()
      const real =
        all.find((item) => item.id.toLowerCase() === RUNTIME_ID) ?? null

      runtimeRef.current = real
      setRuntime(real)

      if (real?.lastTelemetryAt) {
        lastTelemetryAt.current = Date.parse(real.lastTelemetryAt)
      }
    } catch (error) {
      showNotice(messageOf(error), 'error')
    }
  }, [showNotice])

  const refreshMaps = useCallback(async () => {
    try {
      const next = await getSavedMaps()
      const saved = next.filter(
        (item) => item.data?.format === 'occupancy-grid-v1',
      )
      const previousLatestId = latestMapIdRef.current
      const latestId = saved[0]?.id ?? null

      latestMapIdRef.current = latestId
      setMaps(saved)
      setSelectedMap((current) => {
        if (!latestId) {
          return ''
        }

        return (
          !current ||
          current === previousLatestId ||
          !saved.some((item) => item.id === current)
        )
          ? latestId
          : current
      })
    } catch (error) {
      showNotice(messageOf(error), 'error')
    }
  }, [showNotice])

  const stop = useCallback(
    async (resumeNavigation = true) => {
      held.current.clear()

      if (manualStopInFlight.current) {
        return
      }

      manualStopInFlight.current = true
      const shouldReportRestart =
        resumeNavigation && navigationRestartPending.current

      try {
        const result = await stopManual(RUNTIME_ID, resumeNavigation)

        if (shouldReportRestart) {
          navigationRestartPending.current = false
          await refresh()
          showNotice(
            result.navigation_restarted
              ? 'Đã dừng điều khiển tay và khởi động lại Nav2.'
              : 'Đã dừng điều khiển tay. Nav2 chưa khởi động lại; hãy kiểm tra map và log robot.',
            result.navigation_restarted ? 'success' : 'error',
          )
        }
      } catch (error) {
        if (shouldReportRestart) {
          showNotice(messageOf(error), 'error')
        }
      } finally {
        manualStopInFlight.current = false
      }
    },
    [refresh, showNotice],
  )

  useEffect(() => {
    void refresh()
    void refreshMaps()

    const runtimeTimer = window.setInterval(() => {
      void refresh()
    }, 1500)
    const mapsTimer = window.setInterval(() => {
      void refreshMaps()
    }, 5000)

    void signalRClient.subscribeRuntime(RUNTIME_ID)
    const removeMap = signalRClient.subscribe<LiveOccupancyGrid>(
      'RobotMapUpdated',
      setGrid,
    )
    const removeTelemetry = signalRClient.subscribe<RobotRuntime>(
      'RobotTelemetryUpdated',
      (payload) => {
        if (payload.id.toLowerCase() === RUNTIME_ID) {
          runtimeRef.current = payload
          setRuntime(payload)

          if (payload.lastTelemetryAt) {
            lastTelemetryAt.current = Date.parse(payload.lastTelemetryAt)
          }
        }
      },
    )

    const stopOnExit = () => {
      const baseUrl = apiClient.defaults.baseURL ?? '/api'
      const apiUrl = (path: string) =>
        new URL(
          `${baseUrl.replace(/\/$/, '')}${path}`,
          window.location.href,
        )

      void fetch(
        apiUrl('/robot-runtimes/real/manual-stop?resumeNavigation=true'),
        {
          method: 'POST',
          keepalive: true,
        },
      )

      if (leaseRef.current) {
        void fetch(apiUrl('/robot-runtimes/real/arm'), {
          method: 'DELETE',
          keepalive: true,
        })
      }
    }

    window.addEventListener('pagehide', stopOnExit)

    return () => {
      window.clearInterval(runtimeTimer)
      window.clearInterval(mapsTimer)
      removeMap()
      removeTelemetry()
      window.removeEventListener('pagehide', stopOnExit)
      void signalRClient.unsubscribeRuntime(RUNTIME_ID)
      void stop()

      if (leaseRef.current) {
        void disarmRuntime(RUNTIME_ID)
      }
    }
  }, [refresh, refreshMaps, stop])

  useEffect(() => {
    if (grid) {
      return
    }

    let active = true

    const loadLatestMap = async () => {
      try {
        const latest = await getLatestRobotMapGrid()

        if (active && latest) {
          setGrid(latest)
        }
      } catch {
        // SignalR is primary; REST polling is only a fallback until a map arrives.
      }
    }

    void loadLatestMap()
    const timer = window.setInterval(() => {
      void loadLatestMap()
    }, 2000)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [grid])

  useEffect(() => {
    const release = () => {
      void stop()
    }

    const keyDown = (event: KeyboardEvent) => {
      const target = event.target

      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      ) {
        return
      }

      const key = event.key.toLowerCase()

      if (HELD_KEYS.has(key)) {
        event.preventDefault()
        held.current.add(key)
      }

      if (event.code === 'Space') {
        event.preventDefault()
        void stop()
      }
    }

    const keyUp = (event: KeyboardEvent) => {
      const wasHeld = held.current.delete(event.key.toLowerCase())

      if (wasHeld && held.current.size === 0) {
        void stop()
      }
    }

    window.addEventListener('blur', release)
    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)
    document.addEventListener('visibilitychange', release)

    return () => {
      window.removeEventListener('blur', release)
      window.removeEventListener('keydown', keyDown)
      window.removeEventListener('keyup', keyUp)
      document.removeEventListener('visibilitychange', release)
    }
  }, [stop])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = runtimeRef.current
      const lease = leaseRef.current
      const connected = Boolean(
        current?.connected &&
          !current.stale &&
          Date.now() - lastTelemetryAt.current < 3000,
      )

      if (
        !connected ||
        !lease ||
        current?.navigationActive ||
        held.current.size === 0
      ) {
        if (!connected && held.current.size) {
          void stop()
        }

        return
      }

      const keys = held.current
      const velocity = {
        linearX:
          (Number(keys.has('w')) - Number(keys.has('s'))) * speed,
        linearY:
          (Number(keys.has('a')) - Number(keys.has('d'))) * speed,
        angularZ:
          (Number(keys.has('q')) - Number(keys.has('e'))) *
          Math.min(0.5, speed * 2.5),
      }

      void sendManualVelocity(RUNTIME_ID, velocity, lease).catch((error) => {
        showNotice(messageOf(error), 'error')
        void stop()
      })
    }, 100)

    return () => window.clearInterval(timer)
  }, [showNotice, speed, stop])

  const arm = async () => {
    setBusy(true)
    setNotice('')

    try {
      const value = await armRuntime(RUNTIME_ID)
      leaseRef.current = value.leaseId
      setLeaseId(value.leaseId)
      await refresh()
      showNotice('Đã mở khóa điều khiển robot thật.', 'success')
    } catch (error) {
      showNotice(messageOf(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  const disarm = async () => {
    setBusy(true)
    await stop()

    try {
      await disarmRuntime(RUNTIME_ID)
      leaseRef.current = null
      setLeaseId(null)
      await refresh()
      showNotice('Đã khóa điều khiển robot.', 'success')
    } catch (error) {
      showNotice(messageOf(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  const toggleMapping = async (enabled: boolean) => {
    if (enabled && !leaseId) {
      return
    }

    setBusy(true)
    await stop(false)

    try {
      await setMapping(RUNTIME_ID, enabled, leaseId)

      if (enabled) {
        navigationRestartPending.current = false
      }

      await refresh()
      showNotice(
        enabled ? 'Đang mapping trực tiếp.' : 'Đã dừng mapping.',
        'success',
      )
    } catch (error) {
      showNotice(messageOf(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleSaveMap = async () => {
    if (!leaseId || !mapName.trim()) {
      return
    }

    setBusy(true)
    showNotice(
      'Đang lưu PGM/YAML trên robot và snapshot vào database…',
    )

    try {
      const saved = await saveRobotMap(mapName.trim(), leaseId)
      setMaps((current) => [
        saved,
        ...current.filter((item) => item.id !== saved.id),
      ])
      setSelectedMap(saved.id)
      await setMapping(RUNTIME_ID, false, leaseId)
      await refreshMaps()
      setGrid(await getSavedRobotMapGrid(saved.id))
      await refresh()
      showNotice(
        `Đã lưu “${saved.name}” phiên bản ${saved.version}; SLAM đã dừng để sẵn sàng khởi chạy Nav2.`,
        'success',
      )
    } catch (error) {
      showNotice(messageOf(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  const startNav = async () => {
    if (!leaseId || !selectedMap) {
      return
    }

    setBusy(true)
    await stop(false)

    try {
      await startNavigationMode(selectedMap, leaseId)
      navigationRestartPending.current = false
      await refresh()
      showNotice(
        'Nav2 đã nạp map. Nếu robot chưa LOCALIZED, hãy đặt initial pose trước khi gửi goal.',
        'success',
      )
    } catch (error) {
      showNotice(messageOf(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  const stopNav = async () => {
    setBusy(true)
    await stop(false)

    try {
      await stopNavigationMode()
      navigationRestartPending.current = true
      await refresh()
      showNotice(
        'Đã dừng Nav2. Nav2 sẽ tự khởi động lại khi bạn dừng điều khiển tay.',
        'success',
      )
    } catch (error) {
      showNotice(messageOf(error), 'error')
    } finally {
      setBusy(false)
    }
  }

  const pointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    key: string,
  ) => {
    event.preventDefault()
    held.current.add(key)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const pointerUp = (key: string) => {
    held.current.delete(key)

    if (held.current.size === 0) {
      void stop()
    }
  }

  const connected = Boolean(runtime?.connected && !runtime.stale)
  const navActive = Boolean(runtime?.navigationActive)
  const mappingActive = Boolean(runtime?.mappingActive)
  const mapPose = runtime?.telemetry?.pose
  const controlsDisabled = !leaseId || !connected || navActive || busy

  const manualButton = (
    key: string,
    label: string,
    icon: React.ReactNode,
  ) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={controlsDisabled}
      onPointerDown={(event) => pointerDown(event, key)}
      onPointerUp={() => pointerUp(key)}
      onPointerCancel={() => pointerUp(key)}
      onLostPointerCapture={() => pointerUp(key)}
      className="flex h-12 select-none items-center justify-center border border-[#d9dce5] bg-white text-[#3f4654] shadow-sm hover:border-primary hover:bg-primary/5 hover:text-primary disabled:bg-[#f1f2f4] disabled:text-[#a3a8b2]"
    >
      {icon}
    </button>
  )

  return (
    <div className="min-h-full bg-[#f9f7fd] p-5 sm:p-8">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Link
              to="/maps"
              aria-label="Quay lại danh sách map"
              className="mt-0.5 flex h-9 w-9 items-center justify-center border border-[#d9dce5] bg-white text-[#596174] hover:border-primary hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                  <MapIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#17181c]">
                    Create Map
                  </h1>
                  <p className="mt-0.5 text-sm text-[#596174]">
                    Điều khiển robot thật và tạo bản đồ bằng SLAM.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${
              connected
                ? 'bg-[#d9f7e7] text-[#087443]'
                : 'bg-[#fee8e8] text-[#b42318]'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {connected && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-50" />
              )}
              <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
            </span>
            {connected ? 'ROBOT ĐANG KẾT NỐI' : 'ROBOT MẤT KẾT NỐI'}
          </div>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="min-w-0 overflow-hidden border border-[#d9dce5] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d9dce5] px-5 py-4">
              <div>
                <h2 className="font-semibold text-[#252933]">Map trực tiếp</h2>
                <p className="mt-1 text-xs text-[#747b8b]">
                  {grid
                    ? `Cập nhật ${new Date(grid.timestamp).toLocaleTimeString()}`
                    : 'Đang chờ dữ liệu SLAM'}
                </p>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ${
                  mappingActive
                    ? 'bg-[#d9f7e7] text-[#087443]'
                    : navActive
                      ? 'bg-[#e3efff] text-primary'
                      : 'bg-[#eef0f3] text-[#596174]'
                }`}
              >
                {mappingActive
                  ? 'SLAM ĐANG CHẠY'
                  : navActive
                    ? 'NAV2 ĐANG CHẠY'
                    : 'CHƯA MAPPING'}
              </span>
            </div>

            <div className="grid gap-4 p-4 2xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)]">
              <LiveOccupancyMap
                grid={grid}
                orientVertically
                robot={mapPose}
                mappingActive={mappingActive}
              />
              <RealtimeCamera
                runtimeId={RUNTIME_ID}
                connected={connected}
                mappingActive={mappingActive}
              />
            </div>

            <div className="grid gap-3 border-t border-[#d9dce5] bg-[#f8f9fb] px-5 py-3 text-sm sm:grid-cols-3">
              <div>
                <span className="text-xs text-[#747b8b]">Vị trí</span>
                <p className="mt-0.5 font-mono font-semibold text-[#252933]">
                  {mapPose
                    ? `${mapPose.x.toFixed(2)} m, ${mapPose.y.toFixed(2)} m`
                    : '—'}
                </p>
              </div>
              <div>
                <span className="text-xs text-[#747b8b]">Hướng</span>
                <p className="mt-0.5 font-mono font-semibold text-[#252933]">
                  {mapPose
                    ? `${((mapPose.yaw * 180) / Math.PI).toFixed(0)}°`
                    : '—'}
                </p>
              </div>
              <div>
                <span className="text-xs text-[#747b8b]">Pin</span>
                <p className="mt-0.5 font-mono font-semibold text-[#252933]">
                  {runtime?.telemetry?.battery == null
                    ? '—'
                    : `${runtime.telemetry.battery.toFixed(0)}%`}
                </p>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <section className="border border-[#d9dce5] bg-white p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold text-[#252933]">Điều khiển</h2>
                </div>
                <span className="text-[10px] font-bold text-[#687386]">
                  {leaseId ? 'ĐÃ ARM' : 'ĐANG KHÓA'}
                </span>
              </div>

              {leaseId ? (
                <button
                  type="button"
                  onClick={() => void disarm()}
                  disabled={busy}
                  className="mb-4 flex h-10 w-full items-center justify-center gap-2 border border-[#d9dce5] bg-white text-sm font-semibold text-[#3f4654] hover:bg-[#f1eff5] disabled:opacity-50"
                >
                  <Lock className="h-4 w-4" />
                  Khóa robot
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void arm()}
                  disabled={!connected || busy}
                  className="mb-4 flex h-10 w-full items-center justify-center gap-2 bg-primary text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  <Unlock className="h-4 w-4" />
                  Mở khóa robot
                </button>
              )}

              <div className="grid grid-cols-3 gap-2">
                {manualButton('q', 'Xoay trái', <RotateCcw className="h-5 w-5" />)}
                {manualButton('w', 'Tiến', <ArrowUp className="h-5 w-5" />)}
                {manualButton('e', 'Xoay phải', <RotateCw className="h-5 w-5" />)}
                {manualButton('a', 'Sang trái', <ArrowLeft className="h-5 w-5" />)}
                {manualButton('s', 'Lùi', <ArrowDown className="h-5 w-5" />)}
                {manualButton('d', 'Sang phải', <ArrowRight className="h-5 w-5" />)}
              </div>

              <div className="mt-4 space-y-2">
                <label
                  htmlFor="robot-speed"
                  className="flex items-center justify-between text-xs text-[#596174]"
                >
                  <span className="flex items-center gap-1.5">
                    <Gauge className="h-3.5 w-3.5" />
                    Tốc độ tối đa
                  </span>
                  <strong className="font-mono text-[#252933]">
                    {speed.toFixed(2)} m/s
                  </strong>
                </label>
                <input
                  id="robot-speed"
                  type="range"
                  min="0.02"
                  max="0.7"
                  step="0.01"
                  value={speed}
                  onChange={(event) => setSpeed(Number(event.target.value))}
                  className="w-full accent-primary"
                />
                <p className="text-[11px] leading-4 text-[#747b8b]">
                  W/S tiến lùi · A/D ngang · Q/E xoay · Space dừng
                </p>
              </div>

              <button
                type="button"
                disabled={navActive || busy}
                onClick={() => void stop()}
                className="mt-4 flex h-10 w-full items-center justify-center gap-2 bg-[#c62828] text-sm font-bold tracking-wide text-white hover:bg-[#a82020] disabled:opacity-50"
              >
                <Square className="h-4 w-4 fill-current" />
                DỪNG
              </button>
            </section>

            <section className="border border-[#d9dce5] bg-white p-4">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-[#252933]">Mapping và lưu</h2>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-2">
                <button
                  type="button"
                  disabled={
                    !leaseId ||
                    !connected ||
                    navActive ||
                    mappingActive ||
                    busy
                  }
                  onClick={() => void toggleMapping(true)}
                  className="flex h-10 items-center justify-center gap-2 bg-primary px-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  <Power className="h-4 w-4" />
                  Bắt đầu mapping
                </button>
                <button
                  type="button"
                  disabled={!mappingActive || busy}
                  onClick={() => void toggleMapping(false)}
                  className="h-10 border border-[#d9dce5] bg-white px-3 text-sm font-semibold text-[#3f4654] hover:bg-[#f1eff5] disabled:opacity-50"
                >
                  Dừng
                </button>
              </div>

              <label className="mt-4 block text-xs font-medium text-[#596174]">
                Tên bản đồ
                <input
                  value={mapName}
                  onChange={(event) => setMapName(event.target.value)}
                  maxLength={120}
                  placeholder="Nhập tên bản đồ"
                  className="mt-1.5 h-10 w-full border border-[#d9dce5] bg-white px-3 text-sm text-[#252933] outline-none focus:border-primary"
                />
              </label>

              <button
                type="button"
                disabled={
                  !leaseId ||
                  !grid ||
                  !mappingActive ||
                  !mapName.trim() ||
                  busy
                }
                onClick={() => void handleSaveMap()}
                className="mt-3 flex h-10 w-full items-center justify-center gap-2 bg-[#087443] px-3 text-sm font-semibold text-white hover:bg-[#066139] disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                Lưu map vào robot và database
              </button>
            </section>

            <section className="border border-[#d9dce5] bg-white p-4">
              <div className="mb-4 flex items-center gap-2">
                <Navigation className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-[#252933]">Nav2</h2>
              </div>

              <select
                value={selectedMap}
                onChange={(event) => setSelectedMap(event.target.value)}
                className="h-10 w-full border border-[#d9dce5] bg-white px-3 text-sm text-[#252933] outline-none focus:border-primary"
              >
                <option value="">Chọn map đã lưu</option>
                {maps.map((map) => (
                  <option key={map.id} value={map.id}>
                    {map.name} · v{map.version}
                  </option>
                ))}
              </select>

              {navActive ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void stopNav()}
                  className="mt-3 h-10 w-full border border-[#d9dce5] bg-white px-3 text-sm font-semibold text-[#3f4654] hover:bg-[#f1eff5] disabled:opacity-50"
                >
                  Dừng Nav2 để điều khiển thủ công
                </button>
              ) : (
                <button
                  type="button"
                  disabled={
                    !leaseId ||
                    !selectedMap ||
                    !connected ||
                    mappingActive ||
                    busy
                  }
                  onClick={() => void startNav()}
                  className="mt-3 h-10 w-full bg-primary px-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  Khởi chạy Nav2 với map
                </button>
              )}
            </section>
          </aside>
        </div>

        {notice && (
          <div
            role={noticeTone === 'error' ? 'alert' : 'status'}
            className={`flex items-start gap-3 border px-4 py-3 text-sm ${
              noticeTone === 'error'
                ? 'border-[#f2b8b5] bg-[#fff1f0] text-[#b42318]'
                : noticeTone === 'success'
                  ? 'border-[#a7e4c5] bg-[#edfdf5] text-[#087443]'
                  : 'border-[#b8d4ff] bg-[#f0f6ff] text-primary'
            }`}
          >
            {noticeTone === 'error' ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{notice}</span>
          </div>
        )}

        {runtime?.telemetry?.error && (
          <div
            role="alert"
            className="flex items-start gap-3 border border-[#f2b8b5] bg-[#fff1f0] px-4 py-3 text-sm text-[#b42318]"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{runtime.telemetry.error}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateMap
