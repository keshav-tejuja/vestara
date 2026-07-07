import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Upload,
  BarChart3,
  Brain,
  Newspaper,
  Bell,
  LogOut,
  Menu,
  X,
  TrendingUp,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'Upload Portfolio' },
  { to: '/charts', icon: BarChart3, label: 'Charts' },
  { to: '/analysis', icon: Brain, label: 'AI Analysis' },
  { to: '/news', icon: Newspaper, label: 'News Feed' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
          className="lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: sidebarOpen ? 0 : '-280px',
          bottom: 0,
          width: '260px',
          background: 'var(--color-surface-sidebar)',
          backdropFilter: 'blur(24px) saturate(180%)',
          borderRight: '1px solid rgba(148, 163, 184, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          transition: 'left 0.3s ease',
          overflowY: 'auto',
        }}
        className="sidebar"
      >
        {/* Logo */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-violet-600))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(99, 102, 241, 0.35)',
          }}>
            <TrendingUp size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }} className="text-gradient">VESTARA</h1>
            <p style={{
              fontSize: '0.6rem',
              color: 'var(--color-slate-500)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>Investor Intelligence</p>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: 'var(--color-slate-400)',
              cursor: 'pointer',
              padding: '4px',
            }}
            className="close-sidebar-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 14px',
                marginBottom: '2px',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#fff' : 'var(--color-slate-400)',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(124, 58, 237, 0.15))'
                  : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                position: 'relative',
              })}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '3px',
                      height: '20px',
                      borderRadius: '0 3px 3px 0',
                      background: 'linear-gradient(180deg, var(--color-primary-500), var(--color-violet-500))',
                    }} />
                  )}
                  <Icon size={18} style={{ opacity: isActive ? 1 : 0.6, flexShrink: 0 }} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div style={{
          padding: '16px 14px',
          borderTop: '1px solid rgba(148, 163, 184, 0.06)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '12px',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--color-primary-700), var(--color-violet-600))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--color-slate-200)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>{user?.name || 'User'}</p>
              <p style={{
                fontSize: '0.7rem',
                color: 'var(--color-slate-500)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '9px',
              fontSize: '0.8rem',
              fontWeight: 500,
              color: 'var(--color-slate-400)',
              background: 'rgba(30, 41, 59, 0.4)',
              border: '1px solid rgba(148, 163, 184, 0.08)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-loss)';
              e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-slate-400)';
              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.08)';
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{
        flex: 1,
        marginLeft: '0',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }} className="main-content">
        {/* Top bar (mobile) */}
        <header style={{
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.06)',
          background: 'rgba(2, 6, 23, 0.6)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-slate-300)',
              cursor: 'pointer',
              padding: '4px',
            }}
            className="menu-btn"
          >
            <Menu size={22} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="mobile-logo">
            <TrendingUp size={18} style={{ color: 'var(--color-primary-400)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }} className="text-gradient">VESTARA</span>
          </div>
        </header>

        {/* Page content */}
        <main style={{
          flex: 1,
          padding: '24px 28px',
          maxWidth: '1400px',
          width: '100%',
          margin: '0 auto',
        }}>
          <Outlet />
        </main>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (min-width: 1024px) {
          .sidebar {
            left: 0 !important;
          }
          .main-content {
            margin-left: 260px !important;
          }
          .menu-btn {
            display: none !important;
          }
          .mobile-logo {
            display: none !important;
          }
          .close-sidebar-btn {
            display: none !important;
          }
          header {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          main {
            padding: 16px 14px !important;
          }
        }
      `}</style>
    </div>
  );
}
