import React, { useState, useEffect } from 'react';
import { newsAPI, portfolioAPI } from '../api/endpoints';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import SentimentBadge from '../components/SentimentBadge';
import { Newspaper, ChevronDown, ChevronUp, ExternalLink, Calendar, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewsPage() {
  const [portfolioNews, setPortfolioNews] = useState(null);
  const [symbolNews, setSymbolNews] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [expandedNewsId, setExpandedNewsId] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [portfolioRes, newsRes] = await Promise.allSettled([
        portfolioAPI.get(),
        newsAPI.getPortfolioNews(),
      ]);

      if (portfolioRes.status === 'fulfilled') {
        setHoldings(portfolioRes.value.data.holdings || []);
      }

      if (newsRes.status === 'fulfilled') {
        setPortfolioNews(newsRes.value.data);
      } else if (newsRes.reason?.response?.status === 404) {
        setPortfolioNews(null);
      }
    } catch (err) {
      toast.error('Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    setExpandedNewsId(null);
    if (tab === 'All') {
      setSymbolNews(null);
      return;
    }

    setTabLoading(true);
    try {
      const { data } = await newsAPI.getForSymbol(tab);
      setSymbolNews(data);
    } catch (err) {
      toast.error(`Failed to load news for ${tab}`);
      setSymbolNews(null);
    } finally {
      setTabLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedNewsId(expandedNewsId === id ? null : id);
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading news feed..." />;

  if (!portfolioNews || holdings.length === 0) {
    return (
      <EmptyState
        icon={Newspaper}
        title="No holdings found"
        message="Upload a portfolio first to get a personalized stock news feed with AI sentiment analysis."
        actionLabel="Upload Portfolio"
        actionTo="/upload"
      />
    );
  }

  // Get current active list of news articles
  const currentNewsList = activeTab === 'All'
    ? Object.values(portfolioNews.news || {}).flat()
    : symbolNews?.news || [];

  const sentiment = activeTab === 'All'
    ? portfolioNews.portfolio_sentiment
    : symbolNews?.sentiment_summary?.overall || 'neutral';

  return (
    <div className="animate-in">
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-slate-50)' }}>News Feed</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)', marginTop: '4px' }}>
          Personalized financial news with AI-generated summaries and sentiment analysis
        </p>
      </div>

      {/* Sentiment Overview Bar */}
      <div className="glass-card-static" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BookOpen size={18} style={{ color: 'var(--color-primary-400)' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-slate-200)' }}>
            {activeTab === 'All' ? 'Portfolio Sentiment' : `${activeTab} Sentiment`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-slate-400)' }}>Overall Outlook:</span>
          <SentimentBadge sentiment={sentiment} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ overflowX: 'auto', paddingBottom: '8px', marginBottom: '20px' }}>
        <div className="tab-group" style={{ width: 'max-content' }}>
          <button
            className={`tab-item ${activeTab === 'All' ? 'active' : ''}`}
            onClick={() => handleTabChange('All')}
          >
            All Holdings
          </button>
          {holdings.map((h) => (
            <button
              key={h.symbol}
              className={`tab-item ${activeTab === h.symbol ? 'active' : ''}`}
              onClick={() => handleTabChange(h.symbol)}
            >
              {h.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* News List */}
      {tabLoading ? (
        <LoadingSpinner text={`Fetching news for ${activeTab}...`} />
      ) : currentNewsList.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="No recent news"
          message={`No news found for ${activeTab === 'All' ? 'your portfolio symbols' : activeTab} in the past 24 hours.`}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {currentNewsList.map((article, index) => {
            const isExpanded = expandedNewsId === index;
            return (
              <div
                key={index}
                className="glass-card"
                style={{ padding: '18px 20px', cursor: 'pointer' }}
                onClick={() => toggleExpand(index)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                        {article.symbol}
                      </span>
                      <SentimentBadge sentiment={article.sentiment} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        {new Date(article.published_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-slate-100)', lineHeight: 1.4, marginBottom: '6px' }}>
                      {article.headline}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-slate-400)' }}>
                      Source: {article.source}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="animate-in" style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(148, 163, 184, 0.08)',
                  }}
                  onClick={(e) => e.stopPropagation()} // Prevent collapse when clicking inside details
                  >
                    {/* Description */}
                    {article.description && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-slate-300)', lineHeight: 1.6, marginBottom: '14px' }}>
                        {article.description}
                      </p>
                    )}

                    {/* AI summary */}
                    {article.ai_summary && (
                      <div style={{
                        background: 'rgba(99, 102, 241, 0.05)',
                        border: '1px solid rgba(99, 102, 241, 0.12)',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        marginBottom: '14px',
                      }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                          AI Summary
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-slate-200)', lineHeight: 1.5 }}>
                          {article.ai_summary}
                        </p>
                      </div>
                    )}

                    {article.url && (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                        style={{ display: 'inline-flex', padding: '6px 14px', fontSize: '0.75rem', textDecoration: 'none' }}
                      >
                        Read Original Article
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
