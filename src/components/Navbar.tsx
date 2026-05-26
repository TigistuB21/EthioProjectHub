'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Navbar.module.css';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => { if (data.user) setUser(data.user); })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
    router.refresh();
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/dashboard/admin';
    if (user.role === 'ADVISOR') return '/dashboard/advisor';
    return '/dashboard/student';
  };

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`${styles.inner} container`}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🏛️</span>
          <span className={styles.logoText}>
            Ethio<span className={styles.logoAccent}>ProjectHub</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className={styles.links}>
          <Link href="/projects" className={`${styles.link} ${pathname === '/projects' ? styles.active : ''}`}>
            Browse Projects
          </Link>
          {user && (
            <Link href={getDashboardLink()} className={`${styles.link} ${pathname.startsWith('/dashboard') ? styles.active : ''}`}>
              Dashboard
            </Link>
          )}
        </div>

        {/* Auth Area */}
        <div className={styles.authArea}>
          {user ? (
            <div className={styles.userMenu}>
              <button className={styles.userBtn} onClick={() => setMenuOpen((v) => !v)}>
                <span className={styles.avatar}>{user.fullName.charAt(0).toUpperCase()}</span>
                <span className={styles.userName}>{user.fullName.split(' ')[0]}</span>
                <span className={styles.chevron}>{menuOpen ? '▲' : '▼'}</span>
              </button>
              {menuOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    <p className={styles.dropdownName}>{user.fullName}</p>
                    <p className={styles.dropdownEmail}>{user.email}</p>
                    <span className={`badge ${
                      user.role === 'ADMIN' ? 'badge-rejected' :
                      user.role === 'ADVISOR' ? 'badge-pending' : 'badge-approved'
                    }`}>{user.role}</span>
                  </div>
                  <div className={styles.dropdownDivider} />
                  <Link href={getDashboardLink()} className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                    📊 Dashboard
                  </Link>
                  <button className={`${styles.dropdownItem} ${styles.dropdownLogout}`} onClick={handleLogout}>
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.authBtns}>
              <Link href="/login" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                Sign In
              </Link>
              <Link href="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button className={styles.hamburger} onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
          <span className={`${styles.bar} ${menuOpen ? styles.barOpen1 : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.barOpen2 : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.barOpen3 : ''}`} />
        </button>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <Link href="/projects" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Browse Projects</Link>
          {user ? (
            <>
              <Link href={getDashboardLink()} className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <button className={`${styles.mobileLink} ${styles.mobileLinkDanger}`} onClick={handleLogout}>Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/login" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link href="/register" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
