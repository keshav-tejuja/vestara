import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import ChartsPage from './pages/ChartsPage';
import AnalysisPage from './pages/AnalysisPage';
import NewsPage from './pages/NewsPage';
import AlertsPage from './pages/AlertsPage';

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--color-slate-900)',
            color: 'var(--color-slate-100)',
            border: '1px solid rgba(148, 163, 184, 0.08)',
            borderRadius: '10px',
            fontSize: '0.875rem',
          },
        }}
      />
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes inside App Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="charts" element={<ChartsPage />} />
          <Route path="analysis" element={<AnalysisPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="alerts" element={<AlertsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
