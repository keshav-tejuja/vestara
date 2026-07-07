import api from './axios';

/* ════════════════════════════════════════════
   AUTH
   ════════════════════════════════════════════ */

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

/* ════════════════════════════════════════════
   PORTFOLIO
   ════════════════════════════════════════════ */

export const portfolioAPI = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('portfolio', file);
    return api.post('/portfolio/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  get: () => api.get('/portfolio'),
  getPnL: () => api.get('/portfolio/pnl'),
  triggerPriceJob: () => api.post('/portfolio/trigger-price-job'),
};

/* ════════════════════════════════════════════
   ANALYSIS
   ════════════════════════════════════════════ */

export const analysisAPI = {
  run: () => api.post('/analysis/run'),
  getLatest: () => api.get('/analysis/latest'),
  getHistory: () => api.get('/analysis/history'),
};

/* ════════════════════════════════════════════
   NEWS
   ════════════════════════════════════════════ */

export const newsAPI = {
  getForSymbol: (symbol) => api.get(`/news/${symbol}`),
  getPortfolioNews: () => api.get('/news/portfolio'),
  getHistory: (symbol, hours = 24) =>
    api.get(`/news/history/${symbol}`, { params: { hours } }),
};

/* ════════════════════════════════════════════
   ALERTS
   ════════════════════════════════════════════ */

export const alertsAPI = {
  create: (data) => api.post('/alerts', data),
  getAll: () => api.get('/alerts'),
  delete: (id) => api.delete(`/alerts/${id}`),
  getNotifications: () => api.get('/alerts/notifications'),
};

/* ════════════════════════════════════════════
   HISTORY
   ════════════════════════════════════════════ */

export const historyAPI = {
  getPortfolio: (days = 30) =>
    api.get('/history/portfolio', { params: { days } }),
  getStock: (symbol, days = 30) =>
    api.get(`/history/stock/${symbol}`, { params: { days } }),
  getPerformance: () => api.get('/history/performance'),
  getNifty: (days = 30) =>
    api.get('/history/nifty', { params: { days } }),
};
