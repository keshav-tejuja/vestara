import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function SentimentBadge({ sentiment }) {
  const config = {
    positive: {
      color: 'var(--color-profit)',
      bg: 'var(--color-profit-bg)',
      icon: TrendingUp,
      label: 'Positive',
    },
    negative: {
      color: 'var(--color-loss)',
      bg: 'var(--color-loss-bg)',
      icon: TrendingDown,
      label: 'Negative',
    },
    neutral: {
      color: 'var(--color-slate-400)',
      bg: 'rgba(148, 163, 184, 0.1)',
      icon: Minus,
      label: 'Neutral',
    },
  };

  const { color, bg, icon: Icon, label } = config[sentiment] || config.neutral;

  return (
    <span
      className="badge"
      style={{ color, background: bg }}
    >
      <Icon size={12} />
      {label}
    </span>
  );
}
