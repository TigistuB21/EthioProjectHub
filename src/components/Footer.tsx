import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <span className={styles.logo}>🏛️ EthioProjectHub</span>
          <p className={styles.tagline}>
            Preserving academic knowledge across Ethiopian universities.
          </p>
        </div>

        <div className={styles.links}>
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Platform</h4>
            <Link href="/projects" className={styles.link}>Browse Projects</Link>
            <Link href="/register" className={styles.link}>Upload Project</Link>
            <Link href="/login" className={styles.link}>Sign In</Link>
          </div>
          <div className={styles.col}>
            <h4 className={styles.colTitle}>Resources</h4>
            <span className={styles.linkMuted}>Computer Science</span>
            <span className={styles.linkMuted}>Engineering</span>
            <span className={styles.linkMuted}>All Departments</span>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className="container">
          <p className={styles.copyright}>
            © {new Date().getFullYear()} EthioProjectHub. Built for Ethiopian universities.
          </p>
        </div>
      </div>
    </footer>
  );
}
