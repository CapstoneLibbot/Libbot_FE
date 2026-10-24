import { useMemo, useState } from 'react';
import { getCameraStreamUrl } from '../api/runtimeApi';

interface Props {
  runtimeId: string;
  connected: boolean;
  mappingActive: boolean;
}

export function RealtimeCamera({ runtimeId, connected, mappingActive }: Props) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const streamUrl = useMemo(() => getCameraStreamUrl(runtimeId, attempt), [runtimeId, attempt]);

  const reconnect = () => {
    setFailed(false);
    setAttempt((value) => value + 1);
  };

  return <section className="realtime-camera" aria-label="Camera robot trực tiếp">
    <div className="realtime-camera-heading">
      <div><h3>Camera trực tiếp</h3><span>IMX500 · MJPEG</span></div>
      <span className={`camera-live-pill ${connected && !failed ? 'active' : ''}`}>
        {connected && !failed ? (mappingActive ? 'LIVE · MAPPING' : 'LIVE') : 'OFFLINE'}
      </span>
    </div>
    <div className="realtime-camera-frame">
      {connected
        ? <img key={attempt} src={streamUrl} alt="Hình ảnh trực tiếp từ camera robot" onLoad={() => setFailed(false)} onError={() => setFailed(true)} />
        : <div className="realtime-camera-empty">Robot đang mất kết nối.</div>}
      {connected && failed && <div className="realtime-camera-empty">
        <span>Không nhận được hình ảnh camera.</span>
        <button type="button" onClick={reconnect}>Kết nối lại</button>
      </div>}
    </div>
  </section>;
}
