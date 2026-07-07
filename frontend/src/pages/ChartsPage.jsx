import { useState, useEffect } from 'react';
import { historyAPI, analysisAPI, portfolioAPI } from '../api/endpoints';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import {
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

const COLORS = [
  '#6366f1', '#8b5cf6', '#10b981', '#f59e0b',
  '#3b82f6', '#ec4899', '#14b8a6', '#f97316',
  '#a78bfa', '#34d399',
];

export default function ChartsPage() {
  const [days, setDays] = useState(30);
  const [portfolioHistory, setPortfolioHistory] = useState(null);
  const [sectorData, setSectorData] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [stockHistory, setStockHistory] = useState(null);
  const [niftyData, setNiftyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noPortfolio, setNoPortfolio] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [days]);

  useEffect(() => {
    if (selectedSymbol) {
      fetchStockHistory(selectedSymbol);
    }
  }, [selectedSymbol, days]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [histRes, analysisRes, portfolioRes, niftyRes] = await Promise.allSettled([
        historyAPI.getPortfolio(days),
        analysisAPI.getLatest(),
        portfolioAPI.get(),
        historyAPI.getNifty(days),
      ]);

      if (histRes.status === 'fulfilled') {
        setPortfolioHistory(histRes.value.data);
      } else if (histRes.reason?.response?.status === 404) {
        setNoPortfolio(true);
      }

      if (analysisRes.status === 'fulfilled' && analysisRes.value.data.analysis?.sector_exposure) {
        const sectors = analysisRes.value.data.analysis.sector_exposure;
        const entries = Object.entries(sectors).map(([name, value]) => ({
          name,
          value: typeof value === 'number' ? value : parseFloat(value) || 0,
        }));
        setSectorData(entries);
      }

      if (portfolioRes.status === 'fulfilled') {
        const h = portfolioRes.value.data.holdings || [];
        setHoldings(h);
        if (h.length > 0 && !selectedSymbol) {
          setSelectedSymbol(h[0].symbol);
        }
      }

      if (niftyRes.status === 'fulfilled') {
        setNiftyData(niftyRes.value.data);
      }
    } catch {
      // handled by individual promise results
    } finally {
      setLoading(false);
    }
  };

  const fetchStockHistory = async (symbol) => {
    try {
      const { data } = await historyAPI.getStock(symbol, days);
      setStockHistory(data);
    } catch {
      setStockHistory(null);
    }
  };

  const formatCurrency = (val) => '₹' + Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  if (loading) return <LoadingSpinner size="lg" text="Loading charts..." />;
  if (noPortfolio) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No portfolio data"
        message="Upload a portfolio first to see historical charts and analysis."
        actionLabel="Upload Portfolio"
        actionTo="/upload"
      />
    );
  }

  // Build portfolio line chart data
  const portfolioChartData = portfolioHistory?.chart_data
    ? portfolioHistory.chart_data.labels.map((label, i) => ({
        date: label,
        value: portfolioHistory.chart_data.portfolio_value[i],
        invested: portfolioHistory.chart_data.total_invested[i],
      }))
    : [];

  // Build stock line chart data
  const stockChartData = stockHistory?.chart_data
    ? stockHistory.chart_data.labels.map((label, i) => ({
        date: label,
        price: stockHistory.chart_data.prices[i],
      }))
    : [];

  // Build comparison chart (portfolio % vs nifty %)
  const comparisonData = (() => {
    if (!portfolioChartData.length) return [];
    const basePortfolio = portfolioChartData[0]?.value || 1;
    const niftyPrices = niftyData?.history || [];

    return portfolioChartData.map((d, i) => {
      const portfolioChange = ((d.value - basePortfolio) / basePortfolio * 100);
      const niftyEntry = niftyPrices[i];
      const baseNifty = niftyPrices[0]?.price || 1;
      const niftyChange = niftyEntry
        ? ((niftyEntry.price - baseNifty) / baseNifty * 100)
        : null;

      return {
        date: d.date,
        portfolio: parseFloat(portfolioChange.toFixed(2)),
        nifty: niftyChange !== null ? parseFloat(niftyChange.toFixed(2)) : null,
      };
    });
  })();

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        borderRadius: '10px',
        padding: '12px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--color-slate-400)', marginBottom: '6px' }}>{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ fontSize: '0.8rem', color: entry.color, fontWeight: 600 }}>
            {entry.name}: {typeof entry.value === 'number' && entry.name.includes('%')
              ? `${entry.value.toFixed(2)}%`
              : formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-slate-50)' }}>Charts</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)', marginTop: '4px' }}>
            Portfolio analytics & visualization
          </p>
        </div>
        <div className="tab-group">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              className={`tab-item ${days === d ? 'active' : ''}`}
              onClick={() => setDays(d)}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>
        {/* Portfolio Value Chart */}
        <div className="glass-card-static" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-slate-200)', marginBottom: '16px' }}>
            Portfolio Value
          </h3>
          {portfolioChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={portfolioChartData}>
                <defs>
                  <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" name="Portfolio Value" stroke="#6366f1" fill="url(#portfolioGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="invested" name="Invested" stroke="#475569" fill="none" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: 'var(--color-slate-500)', fontSize: '0.85rem' }}>No history data yet. Trigger a price job to populate.</p>
            </div>
          )}
        </div>

        {/* Sector Exposure Pie */}
        <div className="glass-card-static" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-slate-200)', marginBottom: '16px' }}>
            Sector Exposure
          </h3>
          {sectorData && sectorData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${value}%`}
                >
                  {sectorData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: 'var(--color-slate-500)', fontSize: '0.85rem' }}>Run AI Analysis to see sector breakdown.</p>
            </div>
          )}
        </div>

        {/* Individual Stock Chart */}
        <div className="glass-card-static" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-slate-200)' }}>
              Stock Price
            </h3>
            <select
              className="input-field"
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              style={{ width: 'auto', minWidth: '140px', padding: '6px 32px 6px 12px', fontSize: '0.8rem' }}
            >
              {holdings.map((h) => (
                <option key={h.symbol} value={h.symbol}>{h.symbol}</option>
              ))}
            </select>
          </div>
          {stockChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={stockChartData}>
                <defs>
                  <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="price" name="Price" stroke="#8b5cf6" fill="url(#stockGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: 'var(--color-slate-500)', fontSize: '0.85rem' }}>No price history for {selectedSymbol} yet.</p>
            </div>
          )}
        </div>

        {/* Nifty Comparison */}
        <div className="glass-card-static" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-slate-200)', marginBottom: '16px' }}>
            Portfolio vs Nifty 50
          </h3>
          {comparisonData.length > 1 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => `${v.toFixed(2)}%`} />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                <Line type="monotone" dataKey="portfolio" name="Portfolio %" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="nifty" name="Nifty 50 %" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: 'var(--color-slate-500)', fontSize: '0.85rem' }}>Need more data points for comparison.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
