import React, { useState, useEffect } from 'react';
import { alertsAPI, portfolioAPI } from '../api/endpoints';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { Bell, Trash2, BellOff, Mail, MessageSquare, ShieldAlert, Plus, Calendar, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  // Form State
  const [symbol, setSymbol] = useState('');
  const [alertType, setAlertType] = useState('price');
  const [condition, setCondition] = useState('above');
  const [targetPrice, setTargetPrice] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alertsRes, notifRes, portfolioRes] = await Promise.allSettled([
        alertsAPI.getAll(),
        alertsAPI.getNotifications(),
        portfolioAPI.get(),
      ]);

      if (alertsRes.status === 'fulfilled') {
        setAlerts(alertsRes.value.data.alerts || []);
      }
      if (notifRes.status === 'fulfilled') {
        setNotifications(notifRes.value.data.notifications || []);
      }
      if (portfolioRes.status === 'fulfilled') {
        const h = portfolioRes.value.data.holdings || [];
        setHoldings(h);
        if (h.length > 0) {
          setSymbol(h[0].symbol);
        }
      }
    } catch (err) {
      toast.error('Failed to load alerts data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!symbol) {
      toast.error('Please select a symbol');
      return;
    }
    if (alertType === 'price' && !targetPrice) {
      toast.error('Please set a target price');
      return;
    }

    setFormLoading(true);
    try {
      const body = {
        symbol,
        alert_type: alertType,
        condition: alertType === 'price' ? condition : null,
        target_price: alertType === 'price' ? parseFloat(targetPrice) : null,
      };

      await alertsAPI.create(body);
      toast.success('Alert created successfully!');
      setTargetPrice('');
      
      // Refresh alerts list
      const { data } = await alertsAPI.getAll();
      setAlerts(data.alerts || []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create alert');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAlert = async (id) => {
    try {
      await alertsAPI.delete(id);
      toast.success('Alert deleted');
      setAlerts(alerts.filter((a) => a.id !== id));
    } catch (err) {
      toast.error('Failed to delete alert');
    }
  };

  const getChannelIcons = (channels) => {
    if (!channels) return null;
    const list = channels.split(',');
    return (
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {list.includes('email') && <Mail size={12} title="Email Alert" style={{ color: 'var(--color-primary-400)' }} />}
        {list.includes('sms') && <MessageSquare size={12} title="SMS Alert" style={{ color: 'var(--color-profit)' }} />}
        {list.includes('websocket') && <Bell size={12} title="In-App Push" style={{ color: 'var(--color-warning)' }} />}
      </div>
    );
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading alerts panel..." />;

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-slate-50)' }}>Alerts & Notifications</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)', marginTop: '4px' }}>
          Set real-time price & volume spike triggers for stocks in your portfolio
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', alignItems: 'start' }}>
        
        {/* Create Alert Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Create Form */}
          <div className="glass-card-static" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-slate-200)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} style={{ color: 'var(--color-primary-400)' }} />
              Create New Trigger
            </h3>
            
            {holdings.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)', lineHeight: 1.5 }}>
                Please upload a portfolio first to enable stock alert creation.
              </p>
            ) : (
              <form onSubmit={handleCreateAlert} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Stock Symbol Selection */}
                <div>
                  <label className="input-label" htmlFor="symbol">Symbol</label>
                  <select
                    id="symbol"
                    className="input-field"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    required
                  >
                    {holdings.map((h) => (
                      <option key={h.symbol} value={h.symbol}>{h.symbol}</option>
                    ))}
                  </select>
                </div>

                {/* Alert Type Selection */}
                <div>
                  <label className="input-label">Trigger Type</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <label style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px',
                      background: alertType === 'price' ? 'rgba(99, 102, 241, 0.12)' : 'var(--color-surface-input)',
                      border: `1px solid ${alertType === 'price' ? 'var(--color-primary-500)' : 'rgba(148, 163, 184, 0.12)'}`,
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}>
                      <input
                        type="radio"
                        name="alertType"
                        value="price"
                        checked={alertType === 'price'}
                        onChange={() => setAlertType('price')}
                        style={{ display: 'none' }}
                      />
                      Price Alert
                    </label>
                    <label style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px',
                      background: alertType === 'volume' ? 'rgba(99, 102, 241, 0.12)' : 'var(--color-surface-input)',
                      border: `1px solid ${alertType === 'volume' ? 'var(--color-primary-500)' : 'rgba(148, 163, 184, 0.12)'}`,
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}>
                      <input
                        type="radio"
                        name="alertType"
                        value="volume"
                        checked={alertType === 'volume'}
                        onChange={() => setAlertType('volume')}
                        style={{ display: 'none' }}
                      />
                      Volume Spike
                    </label>
                  </div>
                </div>

                {/* Price alert specific options */}
                {alertType === 'price' && (
                  <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label className="input-label" htmlFor="condition">Condition</label>
                      <select
                        id="condition"
                        className="input-field"
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                        required
                      >
                        <option value="above">Price Goes Above</option>
                        <option value="below">Price Goes Below</option>
                      </select>
                    </div>

                    <div>
                      <label className="input-label" htmlFor="targetPrice">Target Price (INR)</label>
                      <input
                        id="targetPrice"
                        type="number"
                        step="0.01"
                        placeholder="e.g. 2450.50"
                        className="input-field"
                        value={targetPrice}
                        onChange={(e) => setTargetPrice(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Volume spike help text */}
                {alertType === 'volume' && (
                  <div className="animate-in" style={{
                    background: 'rgba(59, 130, 246, 0.06)',
                    border: '1px solid rgba(59, 130, 246, 0.15)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                  }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-300)', lineHeight: 1.5 }}>
                      Triggers automatically if the volume exceeds its 30-day daily average by more than <strong style={{ color: 'var(--color-info)' }}>200%</strong>.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={formLoading}
                  style={{ width: '100%', marginTop: '6px' }}
                >
                  {formLoading ? (
                    <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                  ) : (
                    'Set Trigger Alert'
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Active Alerts List */}
          <div className="glass-card-static" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-slate-200)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={18} style={{ color: 'var(--color-warning)' }} />
              Active Triggers ({alerts.length})
            </h3>

            {alerts.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <BellOff size={24} style={{ color: 'var(--color-slate-650)', opacity: 0.6, marginBottom: '8px' }} />
                <p style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)' }}>No active triggers configured.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto' }}>
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: 'rgba(30, 41, 59, 0.3)',
                      border: '1px solid rgba(148, 163, 184, 0.05)',
                      borderRadius: '8px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-slate-100)' }}>
                          {alert.symbol}
                        </span>
                        <span className="badge badge-primary" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                          {alert.alert_type}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)', marginTop: '4px' }}>
                        {alert.alert_type === 'price'
                          ? `${alert.condition === 'above' ? 'Goes above' : 'Drops below'} ₹${alert.target_price}`
                          : 'Volume spike trigger'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-slate-500)',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '6px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-loss)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-slate-500)'}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Timeline Notification History Column */}
        <div className="glass-card-static" style={{ padding: '20px', minHeight: '400px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-slate-200)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} style={{ color: 'var(--color-profit)' }} />
            Notification Timeline
          </h3>

          {notifications.length === 0 ? (
            <EmptyState
              icon={BellOff}
              title="Timeline empty"
              message="When alerts are triggered by market shifts, they'll populate here chronologically."
            />
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              paddingLeft: '16px',
              borderLeft: '1px solid rgba(148, 163, 184, 0.1)',
              maxHeight: '700px',
              overflowY: 'auto',
              gap: '20px',
            }}>
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  style={{ position: 'relative' }}
                  className="animate-in"
                >
                  {/* Bullet indicator */}
                  <div style={{
                    position: 'absolute',
                    left: '-22px',
                    top: '4px',
                    width: '11px',
                    height: '11px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-violet-500))',
                    border: '2px solid var(--color-slate-950)',
                    boxShadow: 'var(--shadow-glow-primary)',
                  }} />

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-slate-100)' }}>
                        {notif.title}
                      </span>
                      {getChannelIcons(notif.channels)}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-slate-400)', lineHeight: 1.4 }}>
                      {notif.message}
                    </p>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.7rem',
                      color: 'var(--color-slate-500)',
                      marginTop: '6px',
                    }}>
                      <Calendar size={10} />
                      {new Date(notif.created_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
