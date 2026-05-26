'use client';

import { useState, FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../auth.module.css';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      const role = data.user.role;
      const redirect =
        callbackUrl ||
        (role === 'ADMIN'
          ? '/dashboard/admin'
          : role === 'ADVISOR'
            ? '/dashboard/advisor'
            : '/dashboard/student');

      router.push(redirect);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Background blobs */}
      <div className={styles.blob1} />
      <div className={styles.blob2} />

      <div className={styles.card}>
        <div className={styles.header}>
          <Link href="/" className={styles.backHome}>🏛️ EthioProjectHub</Link>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in to access the repository</p>
        </div>

        {error && (
          <div className={styles.errorBox} role="alert">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email address</label>
            <input
              id="email"
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
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? <span className={styles.spinner} /> : null}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Quick-fill hints */}
        <div className={styles.demoAccounts}>
          <p className={styles.demoTitle}>Demo accounts</p>
          <div className={styles.demoGrid}>
            <button className={styles.demoBtn} onClick={() => { setEmail('admin@ethioprojecthub.edu.et'); setPassword('admin123'); }}>
              🔑 Admin
            </button>
            <button className={styles.demoBtn} onClick={() => { setEmail('advisor@ethioprojecthub.edu.et'); setPassword('advisor123'); }}>
              👨‍🏫 Advisor
            </button>
            <button className={styles.demoBtn} onClick={() => { setEmail('student@ethioprojecthub.edu.et'); setPassword('student123'); }}>
              🎓 Student
            </button>
          </div>
        </div>

        <p className={styles.switchLink}>
          Don&apos;t have an account?{' '}
          <Link href="/register" className={styles.switchAnchor}>Create one →</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className={styles.page}>
        <div className={styles.card} style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1.5rem' }}></div>
          <p>Loading login portal...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
