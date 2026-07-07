import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { portfolioAPI } from '../api/endpoints';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.name.endsWith('.csv')) {
      setFile(dropped);
    } else {
      toast.error('Please upload a .csv file');
    }
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const { data } = await portfolioAPI.upload(file);
      setResult(data);
      toast.success(`Portfolio uploaded! ${data.total_holdings} holdings added.`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Upload failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="animate-in" style={{ maxWidth: '560px', margin: '0 auto', paddingTop: '40px' }}>
        <div className="glass-card-static" style={{ padding: '40px 32px', textAlign: 'center' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--color-profit-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <CheckCircle2 size={28} style={{ color: 'var(--color-profit)' }} />
          </div>
          <h2 style={{
            fontSize: '1.3rem',
            fontWeight: 700,
            color: 'var(--color-slate-50)',
            marginBottom: '8px',
          }}>Portfolio Uploaded!</h2>
          <p style={{
            fontSize: '0.9rem',
            color: 'var(--color-slate-400)',
            marginBottom: '24px',
          }}>
            <strong style={{ color: 'var(--color-profit)' }}>{result.total_holdings}</strong> holdings
            have been added to your portfolio.
          </p>

          {result.warnings && result.warnings.length > 0 && (
            <div style={{
              background: 'var(--color-warning-bg)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
              textAlign: 'left',
            }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-warning)', marginBottom: '6px' }}>
                <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                Warnings
              </p>
              {result.warnings.map((w, i) => (
                <p key={i} style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)', marginTop: '4px' }}>
                  {typeof w === 'string' ? w : JSON.stringify(w)}
                </p>
              ))}
            </div>
          )}

          <button
            onClick={() => navigate('/')}
            className="btn-primary"
            style={{ padding: '12px 28px' }}
          >
            Go to Dashboard
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--color-slate-50)',
          letterSpacing: '-0.02em',
        }}>Upload Portfolio</h2>
        <p style={{
          fontSize: '0.8rem',
          color: 'var(--color-slate-500)',
          marginTop: '4px',
        }}>Upload your stock holdings as a CSV file</p>
      </div>

      <div style={{
        maxWidth: '600px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {/* Drop zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragging ? 'var(--color-primary-500)' : 'rgba(148, 163, 184, 0.15)'}`,
            borderRadius: 'var(--radius-card)',
            padding: '48px 32px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
            transition: 'all 0.25s ease',
          }}
        >
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(124, 58, 237, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Upload size={24} style={{ color: 'var(--color-primary-400)' }} />
          </div>
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-slate-200)', marginBottom: '6px' }}>
            {file ? file.name : 'Drop your CSV here or click to browse'}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-slate-500)' }}>
            {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Supports .csv files only'}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        {/* Upload button */}
        {file && (
          <button
            onClick={handleUpload}
            className="btn-primary animate-in"
            disabled={loading}
            style={{ padding: '12px', width: '100%' }}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} />
                Upload Portfolio
              </>
            )}
          </button>
        )}

        {/* CSV format guide */}
        <div className="glass-card-static" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <FileSpreadsheet size={16} style={{ color: 'var(--color-primary-400)' }} />
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-slate-200)' }}>
              CSV Format Guide
            </h4>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-slate-400)', marginBottom: '12px' }}>
            Your CSV must include these columns:
          </p>
          <pre style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(148, 163, 184, 0.06)',
            borderRadius: '8px',
            padding: '14px 16px',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            color: 'var(--color-slate-300)',
            overflowX: 'auto',
            lineHeight: 1.6,
          }}>
{`symbol,company_name,quantity,avg_cost
RELIANCE,Reliance Industries,10,2400
INFY,Infosys Limited,5,1500
HDFCBANK,HDFC Bank,8,1600
TCS,Tata Consultancy Services,3,3500
WIPRO,Wipro Limited,15,450`}
          </pre>
        </div>
      </div>
    </div>
  );
}
