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

interface University {
  id: string;
  name: string;
  code: string;
  domains: string;
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<'STUDENT' | 'ADVISOR'>('STUDENT');
  const [universityId, setUniversityId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [customUniversity, setCustomUniversity] = useState('');
  const [customDepartment, setCustomDepartment] = useState('');
  const [universities, setUniversities] = useState<University[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch universities and initial departments on mount
  useEffect(() => {
    fetch('/api/universities')
      .then((r) => r.json())
      .then((data) => setUniversities(data.universities || []))
      .catch(() => {});

    fetch('/api/departments')
      .then((r) => r.json())
      .then((data) => setDepartments(data.departments || []))
      .catch(() => {});
  }, []);

  // Fetch departments when selected university changes
  useEffect(() => {
    if (!universityId) return;
    fetch(`/api/departments?universityId=${universityId}`)
      .then((r) => r.json())
      .then((data) => setDepartments(data.departments || []))
      .catch(() => {});
  }, [universityId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!universityId) {
      setError('Please select or enter your university');
      return;
    }
    if (universityId === 'OTHER' && !customUniversity.trim()) {
      setError('Please enter your university name');
      return;
    }

    if (!departmentId) {
      setError('Please select or enter your department');
      return;
    }
    if (departmentId === 'OTHER' && !customDepartment.trim()) {
      setError('Please enter your department name');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          accountType,
          departmentId,
          universityId,
          customUniversity,
          customDepartment,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      if (accountType === 'ADVISOR') {
        setSuccessMsg('Advisor account created! Access pending verification by your department admin.');
        setTimeout(() => {
          router.push('/dashboard/advisor');
          router.refresh();
        }, 2000);
      } else {
        router.push('/dashboard/student');
        router.refresh();
      }
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
          <p className={styles.subtitle}>Join thousands of Ethiopian students & faculty members sharing knowledge</p>
        </div>

        {error && (
          <div className={styles.errorBox} role="alert">⚠️ {error}</div>
        )}
        {successMsg && (
          <div className={styles.successBox} style={{ padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: '0.5rem', backgroundColor: '#def7ec', color: '#03543f', border: '1px solid #bcf0da' }}>
            ✅ {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="form-group">
            <label htmlFor="accountType" className="form-label">I am registering as</label>
            <select
              id="accountType"
              className="form-input form-select"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as 'STUDENT' | 'ADVISOR')}
              required
            >
              <option value="STUDENT">👨‍🎓 Student / Graduate</option>
              <option value="ADVISOR">👨‍🏫 Academic Advisor / Faculty Member</option>
            </select>
          </div>
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
            <label htmlFor="university" className="form-label">University</label>
            <select
              id="university"
              className="form-input form-select"
              value={universityId}
              onChange={(e) => {
                setUniversityId(e.target.value);
                if (e.target.value !== 'OTHER') {
                  setCustomUniversity('');
                }
              }}
              required
            >
              <option value="">Select your university…</option>
              {universities.map((univ) => (
                <option key={univ.id} value={univ.id}>
                  {univ.name} ({univ.code})
                </option>
              ))}
              <option value="OTHER">✨ Other (Enter manually)</option>
            </select>
          </div>

          {universityId === 'OTHER' && (
            <div className="form-group">
              <label htmlFor="customUniversity" className="form-label">University Name</label>
              <input
                id="customUniversity"
                type="text"
                className="form-input"
                value={customUniversity}
                onChange={(e) => setCustomUniversity(e.target.value)}
                placeholder="Enter your university name"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="department" className="form-label">Department</label>
            <select
              id="department"
              className="form-input form-select"
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                if (e.target.value !== 'OTHER') {
                  setCustomDepartment('');
                }
              }}
              required
            >
              <option value="">Select your department…</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
              <option value="OTHER">✨ Other (Enter manually)</option>
            </select>
          </div>

          {departmentId === 'OTHER' && (
            <div className="form-group">
              <label htmlFor="customDepartment" className="form-label">Department Name</label>
              <input
                id="customDepartment"
                type="text"
                className="form-input"
                value={customDepartment}
                onChange={(e) => setCustomDepartment(e.target.value)}
                placeholder="Enter your department name"
                required
              />
            </div>
          )}

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
