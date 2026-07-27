'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
  overview: {
    total: number;
    approved: number;
    pending: number;
    revision: number;
    rejected: number;
    approvalRate: number;
  };
  yearDistribution: { year: number; count: number }[];
  topTags: { name: string; count: number }[];
}

export default function InstitutionalAnalyticsWidget() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/analytics');
        if (res.ok) {
          const json = await res.json();
          setData(json.analytics);
        }
      } catch (err) {
        console.error('Failed to load institutional analytics widget:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div style={{ padding: '1rem', color: 'hsl(var(--text-secondary))' }}>Loading institutional analytics...</div>;
  }

  if (!data) return null;

  return (
    <div style={{
      backgroundColor: 'hsl(222 47% 11%)',
      border: '1px solid hsl(217 33% 20%)',
      borderRadius: '12px',
      padding: '1.5rem',
      marginTop: '1.5rem',
      color: 'hsl(var(--text-primary))'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        📊 Institutional Research & Tag Analytics
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {/* Metric 1: Approval Velocity */}
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'hsl(var(--text-secondary))' }}>Approval Velocity</h4>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'hsl(142 71% 45%)' }}>
            {data.overview.approvalRate}% Approved
          </div>
          <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', margin: '0.2rem 0 0 0' }}>
            {data.overview.approved} of {data.overview.total} papers accepted
          </p>
        </div>

        {/* Metric 2: Popular Research Topics */}
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'hsl(var(--text-secondary))' }}>Top Department Topics</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {data.topTags.map((tag) => (
              <span key={tag.name} style={{
                backgroundColor: 'hsl(217 33% 18%)',
                border: '1px solid hsl(217 33% 25%)',
                borderRadius: '16px',
                padding: '0.2rem 0.6rem',
                fontSize: '0.75rem',
                color: 'hsl(var(--text-primary))'
              }}>
                #{tag.name} ({tag.count})
              </span>
            ))}
          </div>
        </div>

        {/* Metric 3: Submissions by Year */}
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'hsl(var(--text-secondary))' }}>Submissions by Class Year</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {data.yearDistribution.map((item) => (
              <div key={item.year} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                <span style={{ width: '45px', color: 'hsl(var(--text-muted))' }}>{item.year}</span>
                <div style={{ flex: 1, backgroundColor: 'hsl(217 33% 18%)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, (item.count / Math.max(1, data.overview.total)) * 100)}%`,
                    backgroundColor: 'hsl(217 91% 60%)',
                    height: '100%'
                  }} />
                </div>
                <span style={{ width: '25px', textAlign: 'right', fontWeight: 600 }}>{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
