import { Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No data yet',
  message = '',
  actionLabel,
  actionTo,
}) {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      textAlign: 'center',
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(124, 58, 237, 0.08))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
      }}>
        <Icon size={28} style={{ color: 'var(--color-primary-400)', opacity: 0.7 }} />
      </div>
      <h3 style={{
        fontSize: '1.1rem',
        fontWeight: 600,
        color: 'var(--color-slate-200)',
        marginBottom: '8px',
      }}>{title}</h3>
      {message && (
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--color-slate-500)',
          maxWidth: '360px',
          lineHeight: 1.5,
        }}>{message}</p>
      )}
      {actionLabel && actionTo && (
        <button
          onClick={() => navigate(actionTo)}
          className="btn-primary"
          style={{ marginTop: '20px' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
