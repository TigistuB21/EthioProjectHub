'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../dashboard.module.css';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface DepartmentManagerProps {
  initialDepartments: Department[];
}

export default function DepartmentManager({ initialDepartments }: DepartmentManagerProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim() || !code.trim()) {
      setError('Both department name and code are required.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim().toUpperCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create department.');
      }

      setSuccess(`Department "${data.department.name}" created successfully!`);
      setName('');
      setCode('');

      // Refresh page to sync departments dropdowns
      router.refresh();

    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="badge badge-rejected" style={{ padding: '0.5rem', width: '100%', marginBottom: '1rem', textAlign: 'center' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="badge badge-approved" style={{ padding: '0.5rem', width: '100%', marginBottom: '1rem', textAlign: 'center' }}>
          {success}
        </div>
      )}

      {/* New Dept Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div className={styles.formGroup} style={{ flex: '2 1 200px', marginBottom: 0 }}>
          <label htmlFor="dept-name">Department Name</label>
          <input
            id="dept-name"
            type="text"
            className={styles.input}
            placeholder="e.g. Electrical & Computer Engineering"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            required
          />
        </div>
        <div className={styles.formGroup} style={{ flex: '1 1 100px', marginBottom: 0 }}>
          <label htmlFor="dept-code">Code</label>
          <input
            id="dept-code"
            type="text"
            className={styles.input}
            placeholder="e.g. ECE"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={submitting}
            required
          />
        </div>
        <button type="submit" disabled={submitting} className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', height: 'fit-content' }}>
          {submitting ? 'Adding...' : '➕ Add Department'}
        </button>
      </form>

      {/* Dept List Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Department Name</th>
              <th>Code (Abbreviation)</th>
            </tr>
          </thead>
          <tbody>
            {initialDepartments.map((dept) => (
              <tr key={dept.id}>
                <td><strong style={{ color: 'hsl(var(--text-primary))' }}>{dept.name}</strong></td>
                <td><span className={styles.userRole}>{dept.code}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
