export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizeClass = size === 'lg' ? 'spinner-lg' : 'spinner';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '14px',
      padding: '40px 0',
    }}>
      <div className={sizeClass} />
      {text && (
        <p style={{
          fontSize: '0.85rem',
          color: 'var(--color-slate-400)',
        }}>{text}</p>
      )}
    </div>
  );
}

export function ShimmerBlock({ width = '100%', height = '20px', borderRadius = '8px' }) {
  return (
    <div
      className="shimmer"
      style={{ width, height, borderRadius }}
    />
  );
}

export function ShimmerCard() {
  return (
    <div className="glass-card-static" style={{ padding: '20px 22px' }}>
      <ShimmerBlock width="40%" height="12px" />
      <div style={{ height: '10px' }} />
      <ShimmerBlock width="60%" height="24px" />
      <div style={{ height: '8px' }} />
      <ShimmerBlock width="30%" height="14px" />
    </div>
  );
}
