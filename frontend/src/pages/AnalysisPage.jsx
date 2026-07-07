import { useState, useEffect } from 'react';
import { analysisAPI } from '../api/endpoints';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { Brain, ShieldAlert, Lightbulb, AlertTriangle, ChevronDown, ChevronUp, Zap, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AnalysisPage() {
  const [analysis, setAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [latestRes, histRes] = await Promise.allSettled([
        analysisAPI.getLatest(),
        analysisAPI.getHistory(),
      ]);

      if (latestRes.status === 'fulfilled') {
        setAnalysis(latestRes.value.data.analysis);
      }
      if (histRes.status === 'fulfilled') {
        setHistory(histRes.value.data.history || []);
      }
    } catch {
      // handled individually
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    setRunning(true);
    try {
      const { data } = await analysisAPI.run();
      // Map the response to the same shape as getLatest
      setAnalysis({
        risk_score: data.risk_score,
        risk_level: data.risk_level,
        sector_exposure: data.sector_exposure,
        red_flags: data.red_flags,
        suggestions: data.ai_insights?.suggestions || [],
        ai_reasoning: data.ai_insights?.overall_assessment || '',
        raw_response: data.ai_insights,
        created_at: data.created_at,
      });
      toast.success('Analysis complete!');
      // Refresh history
      const histRes = await analysisAPI.getHistory();
      setHistory(histRes.data.history || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed');
    } finally {
      setRunning(false);
    }
  };

  const getRiskColor = (score) => {
    if (score <= 30) return 'var(--color-profit)';
    if (score <= 60) return 'var(--color-warning)';
    return 'var(--color-loss)';
  };

  const getRiskBadgeClass = (level) => {
    if (!level) return 'badge-neutral';
    const l = level.toLowerCase();
    if (l === 'low') return 'badge-profit';
    if (l === 'medium') return 'badge-warning';
    return 'badge-loss';
  };

  const getPriorityColor = (priority) => {
    if (!priority) return 'var(--color-slate-400)';
    const p = priority.toLowerCase();
    if (p === 'high') return 'var(--color-loss)';
    if (p === 'medium') return 'var(--color-warning)';
    return 'var(--color-profit)';
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading analysis..." />;

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-slate-50)' }}>AI Analysis</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)', marginTop: '4px' }}>
            Powered by Groq LLaMA 3
          </p>
        </div>
        <button
          onClick={handleRunAnalysis}
          className="btn-primary"
          disabled={running}
        >
          {running ? (
            <>
              <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
              Analyzing... (~10s)
            </>
          ) : (
            <>
              <Zap size={16} />
              Run Analysis
            </>
          )}
        </button>
      </div>

      {!analysis && !running ? (
        <EmptyState
          icon={Brain}
          title="No analysis yet"
          message="Run your first AI-powered portfolio analysis to get risk scores, sector insights, and personalized suggestions."
        />
      ) : analysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Risk score + level row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {/* Risk gauge */}
            <div className="glass-card-static" style={{ padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                Risk Score
              </p>
              <div style={{ position: 'relative', width: '140px', height: '140px' }}>
                <svg viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                  {/* Background ring */}
                  <circle
                    cx="70" cy="70" r="58"
                    fill="none"
                    stroke="rgba(148, 163, 184, 0.08)"
                    strokeWidth="12"
                  />
                  {/* Score ring */}
                  <circle
                    cx="70" cy="70" r="58"
                    fill="none"
                    stroke={getRiskColor(analysis.risk_score)}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(analysis.risk_score / 100) * 364.4} 364.4`}
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <span style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    color: getRiskColor(analysis.risk_score),
                    letterSpacing: '-0.03em',
                  }}>{analysis.risk_score}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-slate-500)' }}>/ 100</span>
                </div>
              </div>
              <span className={`badge ${getRiskBadgeClass(analysis.risk_level)}`} style={{ marginTop: '14px', fontSize: '0.75rem' }}>
                {analysis.risk_level || 'Unknown'}
              </span>
            </div>

            {/* Sector exposure */}
            <div className="glass-card-static" style={{ padding: '20px', flex: 1 }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                Sector Exposure
              </p>
              {analysis.sector_exposure && Object.entries(analysis.sector_exposure).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(analysis.sector_exposure).map(([sector, pct]) => (
                    <div key={sector}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-slate-300)' }}>{sector}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-slate-200)' }}>{pct}%</span>
                      </div>
                      <div style={{
                        height: '6px',
                        background: 'rgba(148, 163, 184, 0.08)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(pct, 100)}%`,
                          background: 'linear-gradient(90deg, var(--color-primary-500), var(--color-violet-500))',
                          borderRadius: '3px',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-500)' }}>No sector data available.</p>
              )}
            </div>
          </div>

          {/* Red flags */}
          {analysis.red_flags && analysis.red_flags.length > 0 && (
            <div className="glass-card-static" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <ShieldAlert size={18} style={{ color: 'var(--color-loss)' }} />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-slate-200)' }}>Red Flags</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                {analysis.red_flags.map((flag, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '12px 14px',
                    background: 'var(--color-loss-bg)',
                    border: '1px solid rgba(244, 63, 94, 0.12)',
                    borderRadius: '10px',
                  }}>
                    <AlertTriangle size={16} style={{ color: 'var(--color-loss)', marginTop: '2px', flexShrink: 0 }} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-slate-300)', lineHeight: 1.5 }}>
                      {typeof flag === 'string' ? flag : flag.message || flag.flag || JSON.stringify(flag)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Suggestions */}
          {analysis.raw_response?.suggestions && analysis.raw_response.suggestions.length > 0 && (
            <div className="glass-card-static" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Lightbulb size={18} style={{ color: 'var(--color-warning)' }} />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-slate-200)' }}>AI Suggestions</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {analysis.raw_response.suggestions.map((s, i) => (
                  <div key={i} style={{
                    padding: '14px 16px',
                    background: 'rgba(30, 41, 59, 0.4)',
                    border: '1px solid rgba(148, 163, 184, 0.06)',
                    borderRadius: '10px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      {s.priority && (
                        <span className="badge" style={{
                          color: getPriorityColor(s.priority),
                          background: `${getPriorityColor(s.priority)}1a`,
                        }}>
                          {s.priority}
                        </span>
                      )}
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-slate-200)' }}>
                        {s.action || s.title || (typeof s === 'string' ? s : '')}
                      </span>
                    </div>
                    {s.reason && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-slate-400)', lineHeight: 1.5 }}>
                        {s.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overall assessment */}
          {(analysis.ai_reasoning || analysis.raw_response?.overall_assessment) && (
            <div className="glass-card-static" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Brain size={18} style={{ color: 'var(--color-primary-400)' }} />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-slate-200)' }}>Overall Assessment</h3>
              </div>
              <p style={{
                fontSize: '0.85rem',
                color: 'var(--color-slate-300)',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
              }}>
                {analysis.ai_reasoning || analysis.raw_response?.overall_assessment}
              </p>
            </div>
          )}

          {/* Analysis history */}
          {history.length > 0 && (
            <div className="glass-card-static" style={{ padding: '20px', overflow: 'hidden' }}>
              <button
                onClick={() => setHistoryOpen(!historyOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: 'var(--color-slate-200)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} style={{ color: 'var(--color-slate-400)' }} />
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Analysis History ({history.length})</h3>
                </div>
                {historyOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {historyOpen && (
                <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {history.map((h, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'rgba(30, 41, 59, 0.3)',
                      borderRadius: '8px',
                    }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-slate-400)' }}>
                        {new Date(h.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: getRiskColor(h.risk_score),
                        }}>
                          {h.risk_score}
                        </span>
                        <span className={`badge ${getRiskBadgeClass(h.risk_level)}`} style={{ fontSize: '0.65rem' }}>
                          {h.risk_level}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
