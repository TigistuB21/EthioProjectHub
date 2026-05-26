'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/departments')
      .then((r) => r.json())
      .then((data) => setDepartments(data.departments || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!departmentId) {
      setError('Please select your department');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, departmentId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      router.push('/dashboard/student');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.blob1} />
      <div className={styles.blob2} />

      <div className={`${styles.card} ${styles.cardWide}`}>
        <div className={styles.header}>
          <Link href="/" className={styles.backHome}>🏛️ EthioProjectHub</Link>
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.subtitle}>Join thousands of Ethiopian students sharing knowledge</p>
        </div>

        {error && (
          <div className={styles.errorBox} role="alert">⚠️ {error}</div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label htmlFor="fullName" className="form-label">Full Name</label>
            <input
              id="fullName"
              type="text"
              className="form-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Abebe Bekele"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email" className="form-label">Email Address</label>
            <input
              id="reg-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu.et"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password" className="form-label">Password</label>
            <input
              id="reg-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="department" className="form-label">Department</label>
            <select
              id="department"
              className="form-input form-select"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              required
            >
              <option value="">Select your department…</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>

          <button
            id="register-submit"
            type="submit"
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? <span className={styles.spinner} /> : null}
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className={styles.switchLink}>
          Already have an account?{' '}
          <Link href="/login" className={styles.switchAnchor}>Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
