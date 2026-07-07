import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ icon: Icon, label, value, trend, trendValue, className = '' }) {
  const getTrendColor = () => {
    if (trend === 'up') return 'var(--color-profit)';
    if (trend === 'down') return 'var(--color-loss)';
    return 'var(--color-slate-400)';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp size={14} />;
    if (trend === 'down') return <TrendingDown size={14} />;
    return <Minus size={14} />;
  };

  return (
    <div className={`glass-card ${className}`} style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: 'var(--color-slate-400)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '8px',
          }}>{label}</p>
          <p style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--color-slate-50)',
            letterSpacing: '-0.02em',
          }}>{value}</p>
          {trendValue !== undefined && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: getTrendColor(),
            }}>
              {getTrendIcon()}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(124, 58, 237, 0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon size={20} style={{ color: 'var(--color-primary-400)' }} />
          </div>
        )}
      </div>
    </div>
  );
}
