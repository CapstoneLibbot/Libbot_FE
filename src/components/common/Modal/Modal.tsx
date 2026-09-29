import { PropsWithChildren } from 'react';

export function Modal({ open, title, children }: PropsWithChildren<{ open: boolean; title?: string }>) {
  if (!open) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.25)', display: 'grid', placeItems: 'center', zIndex: 20 }}>
      <div className="panel" style={{ width: 520, maxWidth: '90vw' }}>
        <div className="panel-header">
          <span className="panel-title">{title ?? 'Dialog'}</span>
        </div>
        <div className="panel-body">{children}</div>
      </div>
    </div>
  );
}
