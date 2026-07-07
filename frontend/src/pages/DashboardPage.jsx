import { useState, useEffect } from 'react';
import { portfolioAPI, historyAPI } from '../api/endpoints';
import { useSocket } from '../hooks/useSocket';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { Wallet, TrendingUp, TrendingDown, BarChart3, Upload } from 'lucide-react';

export default function DashboardPage() {
  const [pnlData, setPnlData] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flashedCells, setFlashedCells] = useState({});
  const { livePnL } = useSocket();

  useEffect(() => {
    fetchData();
  }, []);

  // Apply live P&L updates from socket
  useEffect(() => {
    if (livePnL && pnlData) {
      // Flash animation on updated values
      const newFlashed = {};
      if (livePnL.holdings) {
        livePnL.holdings.forEach((h) => {
          newFlashed[h.symbol] = true;
        });
      }
      setFlashedCells(newFlashed);
      setPnlData(livePnL);

      // Clear flash after animation
      setTimeout(() => setFlashedCells({}), 800);
    }
  }, [livePnL]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pnlRes, perfRes] = await Promise.allSettled([
        portfolioAPI.getPnL(),
        historyAPI.getPerformance(),
      ]);

      if (pnlRes.status === 'fulfilled') {
        setPnlData(pnlRes.value.data);
      } else if (pnlRes.reason?.response?.status === 404) {
        setPnlData(null); // No portfolio
      } else {
        setError('Failed to load portfolio data');
      }

      if (perfRes.status === 'fulfilled') {
        setPerformance(perfRes.value.data);
      }
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '—';
    return '₹' + Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatPercent = (val) => {
    if (val === null || val === undefined) return '—';
    const sign = val >= 0 ? '+' : '';
    return `${sign}${Number(val).toFixed(2)}%`;
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading dashboard..." />;
  if (error) return <EmptyState title="Error" message={error} />;
  if (!pnlData) {
    return (
      <EmptyState
        icon={Upload}
        title="No portfolio found"
        message="Upload your stock portfolio as a CSV to see live P&L tracking, charts, and AI analysis."
        actionLabel="Upload Portfolio"
        actionTo="/upload"
      />
    );
  }

  const { summary, holdings } = pnlData;

  return (
    <div className="animate-in">
      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--color-slate-50)',
          letterSpacing: '-0.02em',
        }}>Dashboard</h2>
        <p style={{
          fontSize: '0.8rem',
          color: 'var(--color-slate-500)',
          marginTop: '4px',
        }}>
          Last updated: {summary?.last_updated
            ? new Date(summary.last_updated).toLocaleString('en-IN')
            : '—'}
        </p>
      </div>

      {/* Hero stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <StatCard
          icon={Wallet}
          label="Portfolio Value"
          value={formatCurrency(summary?.total_current_value)}
          trend={summary?.is_profit ? 'up' : 'down'}
          trendValue={`${formatPercent(summary?.total_pnl_percent)} overall`}
          className="animate-in animate-in-delay-1"
        />
        <StatCard
          icon={summary?.is_profit ? TrendingUp : TrendingDown}
          label="Total P&L"
          value={formatCurrency(summary?.total_pnl)}
          trend={summary?.is_profit ? 'up' : 'down'}
          trendValue={formatPercent(summary?.total_pnl_percent)}
          className="animate-in animate-in-delay-2"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Invested"
          value={formatCurrency(summary?.total_invested)}
          className="animate-in animate-in-delay-3"
        />
        <StatCard
          icon={BarChart3}
          label="Holdings"
          value={holdings?.length || 0}
          trend={performance?.best_performer ? 'up' : undefined}
          trendValue={performance?.best_performer
            ? `Best: ${performance.best_performer.symbol} ${formatPercent(performance.best_performer.pnl_percent)}`
            : undefined}
          className="animate-in animate-in-delay-4"
        />
      </div>

      {/* Holdings table */}
      <div className="glass-card-static animate-in" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
        }}>
          <h3 style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            color: 'var(--color-slate-200)',
          }}>Holdings</h3>
        </div>
        <div className="overflow-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Company</th>
                <th style={{ textAlign: 'right' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Avg Cost</th>
                <th style={{ textAlign: 'right' }}>Current Price</th>
                <th style={{ textAlign: 'right' }}>P&L (₹)</th>
                <th style={{ textAlign: 'right' }}>P&L %</th>
                <th style={{ textAlign: 'right' }}>Today %</th>
              </tr>
            </thead>
            <tbody>
              {holdings?.map((h) => {
                const isProfit = h.pnl >= 0;
                const isFlashed = flashedCells[h.symbol];
                return (
                  <tr key={h.symbol || h.id}>
                    <td>
                      <span style={{
                        fontWeight: 600,
                        color: 'var(--color-slate-100)',
                      }}>{h.symbol}</span>
                    </td>
                    <td style={{ color: 'var(--color-slate-400)', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {h.company_name || '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>{h.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(h.avg_cost)}</td>
                    <td
                      style={{ textAlign: 'right', fontWeight: 500 }}
                      className={isFlashed ? 'value-flash' : ''}
                    >
                      {h.current_price ? formatCurrency(h.current_price) : (
                        <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>Unavailable</span>
                      )}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        color: h.error ? 'var(--color-slate-500)' : (isProfit ? 'var(--color-profit)' : 'var(--color-loss)'),
                      }}
                      className={isFlashed ? 'value-flash' : ''}
                    >
                      {h.error ? '—' : formatCurrency(h.pnl)}
                    </td>
                    <td style={{
                      textAlign: 'right',
                      fontWeight: 600,
                    }}>
                      {h.error ? '—' : (
                        <span className={`badge ${isProfit ? 'badge-profit' : 'badge-loss'}`}>
                          {formatPercent(h.pnl_percent)}
                        </span>
                      )}
                    </td>
                    <td style={{
                      textAlign: 'right',
                      color: h.change_percent >= 0 ? 'var(--color-profit)' : 'var(--color-loss)',
                      fontSize: '0.8rem',
                    }}>
                      {h.change_percent !== undefined ? formatPercent(h.change_percent) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
