import { useMemo, useState } from 'react';
import { Button } from '../../../components/common/Button/Button';
import { MapCanvas } from '../../../components/map/MapCanvas';
import { MapBackground } from '../../../components/map/MapBackground';
import { PathLine } from '../../../components/map/PathLine';
import { RobotMarker } from '../../../components/map/RobotMarker';
import { GoalMarker } from '../../../components/map/GoalMarker';
import { StartMarker } from '../../../components/map/StartMarker';
import { PageContainer } from '../../../components/layout/PageContainer';
import { LibrarianLayout } from '../../../layouts/LibrarianLayout';
import { PathPoint } from '../../../types/map';
import { useDispatchPreview } from '../../dispatch/hooks/useDispatchPreview';

function buildRoute(start: { x: number; y: number }, end: { x: number; y: number }): PathPoint[] {
  const safeRoute: PathPoint[] = [
    { x: start.x, y: start.y },
    { x: start.x, y: 22 },
    { x: 18, y: 22 },
    { x: 18, y: 58 },
    { x: 48, y: 58 },
    { x: 48, y: 34 },
    { x: 64, y: 34 },
    { x: 64, y: end.y },
    { x: end.x, y: end.y }
  ];

  return safeRoute;
}

function ReadingRoomFurniture() {
  const shelves = [
    { x: 22, y: 27, width: 19, rows: 3 },
    { x: 51, y: 18, width: 18, rows: 3 },
    { x: 79, y: 18, width: 16, rows: 5 },
    { x: 22, y: 68, width: 19, rows: 3 },
    { x: 51, y: 73, width: 18, rows: 2 },
    { x: 79, y: 73, width: 16, rows: 2 }
  ];
  const bookColors = ['#7fa58a', '#7d9fbd', '#d1b66f', '#b97872', '#a58bb8'];

  return (
    <g aria-label="Bookshelves and reading tables">
      {shelves.map((shelf, shelfIndex) => (
        <g key={`shelf-${shelfIndex}`}>
          <rect
            x={shelf.x}
            y={shelf.y}
            width={shelf.width}
            height={shelf.rows * 3 + 1}
            rx={0.6}
            fill="#26323a"
            stroke="#94a3ad"
            strokeWidth={0.45}
          />
          {Array.from({ length: shelf.rows }, (_, rowIndex) => (
            <g key={`shelf-row-${rowIndex}`}>
              <line
                x1={shelf.x + 0.6}
                y1={shelf.y + rowIndex * 3 + 2.7}
                x2={shelf.x + shelf.width - 0.6}
                y2={shelf.y + rowIndex * 3 + 2.7}
                stroke="#bac5cb"
                strokeWidth={0.35}
              />
              {Array.from({ length: Math.floor((shelf.width - 2) / 2.7) }, (_, bookIndex) => (
                <rect
                  key={`book-${bookIndex}`}
                  x={shelf.x + 0.8 + bookIndex * 2.7}
                  y={shelf.y + rowIndex * 3 + 0.45}
                  width={1.8}
                  height={2}
                  rx={0.2}
                  fill={bookColors[(bookIndex + rowIndex + shelfIndex) % bookColors.length]}
                  opacity={0.9}
                />
              ))}
            </g>
          ))}
        </g>
      ))}

      {[24, 78].map((x) => (
        <g key={`reading-table-${x}`}>
          <rect x={x} y={50} width={9} height={3.2} rx={0.8} fill="#526b68" stroke="#b6c8c2" strokeWidth={0.45} />
          <line x1={x + 1} y1={51.1} x2={x + 8} y2={51.1} stroke="#dce8e2" strokeWidth={0.35} opacity={0.7} />
          <circle cx={x + 1.2} cy={54.4} r={0.65} fill="#aab8b5" />
          <circle cx={x + 7.8} cy={54.4} r={0.65} fill="#aab8b5" />
          <rect x={x + 3.2} y={49.1} width={2.4} height={0.65} rx={0.15} fill="#d1b66f" />
        </g>
      ))}
    </g>
  );
}

export function MapDemoPage() {
  const [start, setStart] = useState({ x: 12, y: 12 });
  const [end, setEnd] = useState({ x: 80, y: 68 });
  const [zoom, setZoom] = useState(1);
  const [showRobotRoute, setShowRobotRoute] = useState(false);

  const route = useMemo(() => buildRoute(start, end), [start, end]);
  const simulation = useDispatchPreview(route);
  const areaRoutes: PathPoint[][] = [
    [{ x: 8, y: 62 }, { x: 92, y: 62 }],
    [{ x: 92, y: 45 }, { x: 8, y: 45 }],
    [{ x: 18, y: 14 }, { x: 18, y: 68 }],
    [{ x: 46, y: 68 }, { x: 46, y: 14 }],
    [{ x: 74, y: 14 }, { x: 74, y: 66 }]
  ];

  const robotAngle = useMemo(() => {
    if (route.length < 2) return 0;
    const currentPoint = simulation.currentPosition;
    const nextIndex = route.findIndex((point) => point.x === currentPoint.x && point.y === currentPoint.y);
    const nextPoint = route[Math.min(nextIndex + 1, route.length - 1)];
    return Math.atan2(nextPoint.y - currentPoint.y, nextPoint.x - currentPoint.x);
  }, [route, simulation.currentPosition]);

  const handleStart = () => {
    simulation.reset();
    setShowRobotRoute(true);
    simulation.play();
  };

  const handleReset = () => {
    simulation.reset();
    setShowRobotRoute(false);
  };

  return (
    <LibrarianLayout>
      <PageContainer>
        <div style={{ padding: '8px 12px 20px', background: '#eff2f7' }}>
          <h2 style={{ margin: '8px 0 20px', color: '#8b5cf6', fontSize: '2.2rem', fontWeight: 700, letterSpacing: '-0.04em' }}>Dispatching workflows</h2>

          <div style={{ background: '#101b23', borderRadius: '18px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 14px 28px rgba(15,23,42,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'linear-gradient(180deg, rgba(20,31,38,0.96), rgba(13,19,25,0.96))', borderBottom: '1px solid rgba(148,163,184,0.22)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: '#e2e8f0', fontWeight: 600 }}>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, letterSpacing: '-0.06em' }}>OTTO</div>
                <div style={{ opacity: 0.8, fontSize: '0.75rem', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Monitor</div>
                <div style={{ opacity: 0.8, fontSize: '0.75rem', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Configure</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.4)' }} />
                <div style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.72rem' }}>Administrator</div>
              </div>
            </div>

            <div style={{ padding: '10px 14px 0', background: '#111c24' }}>
              <div className="controls-row map-demo-controls" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div className="form-row" style={{ minWidth: 100 }}>
                  <label className="field-label" style={{ color: '#dfe7f5', fontSize: 11 }}>Start X</label>
                  <input className="field-input" type="number" value={start.x} onChange={(e) => setStart((prev) => ({ ...prev, x: Number(e.target.value) }))} style={{ background: 'rgba(15,23,42,0.85)', color: '#e2e8f0', border: '1px solid rgba(96,165,250,0.4)' }} />
                </div>
                <div className="form-row" style={{ minWidth: 100 }}>
                  <label className="field-label" style={{ color: '#dfe7f5', fontSize: 11 }}>Start Y</label>
                  <input className="field-input" type="number" value={start.y} onChange={(e) => setStart((prev) => ({ ...prev, y: Number(e.target.value) }))} style={{ background: 'rgba(15,23,42,0.85)', color: '#e2e8f0', border: '1px solid rgba(96,165,250,0.4)' }} />
                </div>
                <div className="form-row" style={{ minWidth: 100 }}>
                  <label className="field-label" style={{ color: '#dfe7f5', fontSize: 11 }}>Goal X</label>
                  <input className="field-input" type="number" value={end.x} onChange={(e) => setEnd((prev) => ({ ...prev, x: Number(e.target.value) }))} style={{ background: 'rgba(15,23,42,0.85)', color: '#e2e8f0', border: '1px solid rgba(96,165,250,0.4)' }} />
                </div>
                <div className="form-row" style={{ minWidth: 100 }}>
                  <label className="field-label" style={{ color: '#dfe7f5', fontSize: 11 }}>Goal Y</label>
                  <input className="field-input" type="number" value={end.y} onChange={(e) => setEnd((prev) => ({ ...prev, y: Number(e.target.value) }))} style={{ background: 'rgba(15,23,42,0.85)', color: '#e2e8f0', border: '1px solid rgba(96,165,250,0.4)' }} />
                </div>

                <Button variant="primary" onClick={handleStart}>Start</Button>
                <Button variant="ghost" onClick={simulation.pause}>Pause</Button>
                <Button variant="ghost" onClick={handleReset}>Reset</Button>
                <Button variant="ghost" onClick={() => setZoom(1)}>100%</Button>
                <Button variant="ghost" onClick={() => setZoom(1.25)}>125%</Button>
                <Button variant="ghost" onClick={() => setZoom(1.6)}>160%</Button>
              </div>
            </div>

            <div className="map-demo-container" style={{ border: 'none', background: '#0d1318', height: 660 }}>
              <div className="map-demo-inner" style={{ width: '100%', height: '100%', transform: `scale(${zoom})`, transformOrigin: 'center top' }}>
                <MapCanvas width={100} height={80}>
                  <MapBackground />
                  <ReadingRoomFurniture />
                  {areaRoutes.map((areaRoute, index) => (
                    <PathLine key={`area-route-${index}`} path={areaRoute} variant="area" />
                  ))}
                  {showRobotRoute && <PathLine path={route} variant="robot" />}
                  <StartMarker x={start.x} y={start.y} />
                  <GoalMarker x={end.x} y={end.y} />
                  <RobotMarker x={simulation.currentPosition.x} y={simulation.currentPosition.y} angle={robotAngle} />
                </MapCanvas>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </LibrarianLayout>
  );
}
