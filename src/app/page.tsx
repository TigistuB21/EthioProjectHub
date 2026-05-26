import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { prisma } from '@/lib/db';
import styles from './landing.module.css';

async function getStats() {
  const [totalProjects, approvedProjects, departments] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: 'APPROVED' } }),
    prisma.department.count(),
  ]);
  return { totalProjects, approvedProjects, departments };
}

async function getRecentProjects() {
  return prisma.project.findMany({
    where: { status: 'APPROVED' },
    take: 6,
    orderBy: { createdAt: 'desc' },
    include: { department: true, tags: true, uploader: { select: { fullName: true } } },
  });
}

export default async function LandingPage() {
  const stats = await getStats();
  const recentProjects = await getRecentProjects();

  return (
    <>
      <Navbar />
      <main>
        {/* ── Hero ── */}
        <section className={styles.hero}>
          <div className={styles.heroBg} />
          <div className={`container ${styles.heroInner}`}>
            <div className={styles.heroContent}>
              <span className={styles.heroBadge}>🇪🇹 Ethiopian Universities</span>
              <h1 className={styles.heroTitle}>
                Discover & Share<br />
                <span className={styles.heroGradient}>Final Year Projects</span>
              </h1>
              <p className={styles.heroSubtitle}>
                A centralized digital repository where Ethiopian university students can explore,
                upload, and build upon academic research — ending the cycle of lost knowledge.
              </p>
              <div className={styles.heroActions}>
                <Link href="/projects" className="btn btn-primary" id="hero-browse-btn">
                  🔍 Browse Projects
                </Link>
                <Link href="/register" className="btn btn-secondary" id="hero-upload-btn">
                  ⬆️ Upload Yours
                </Link>
              </div>
            </div>

            {/* Floating Cards */}
            <div className={styles.heroCards}>
              <div className={`${styles.floatCard} ${styles.floatCard1}`}>
                <span className={styles.floatIcon}>🤖</span>
                <div>
                  <p className={styles.floatTitle}>AI-Powered Tags</p>
                  <p className={styles.floatDesc}>Auto-extracted by Gemini</p>
                </div>
              </div>
              <div className={`${styles.floatCard} ${styles.floatCard2}`}>
                <span className={styles.floatIcon}>📄</span>
                <div>
                  <p className={styles.floatTitle}>PDF Storage</p>
                  <p className={styles.floatDesc}>Download & reference freely</p>
                </div>
              </div>
              <div className={`${styles.floatCard} ${styles.floatCard3}`}>
                <span className={styles.floatIcon}>✅</span>
                <div>
                  <p className={styles.floatTitle}>Advisor Reviewed</p>
                  <p className={styles.floatDesc}>Quality-assured projects</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats Bar ── */}
        <section className={styles.statsSection}>
          <div className={`container ${styles.statsGrid}`}>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{stats.totalProjects}</span>
              <span className={styles.statLabel}>Total Projects</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{stats.approvedProjects}</span>
              <span className={styles.statLabel}>Approved Projects</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{stats.departments}</span>
              <span className={styles.statLabel}>Departments</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statCard}>
              <span className={styles.statNumber}>Free</span>
              <span className={styles.statLabel}>Always Open Access</span>
            </div>
          </div>
        </section>

        {/* ── Recent Projects ── */}
        <section className={styles.recentSection}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recently Approved Projects</h2>
              <Link href="/projects" className={styles.sectionLink}>View all →</Link>
            </div>

            {recentProjects.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📂</span>
                <p>No approved projects yet. Be the first to upload!</p>
                <Link href="/register" className="btn btn-primary" style={{ marginTop: '1rem' }}>Upload a Project</Link>
              </div>
            ) : (
              <div className={styles.projectGrid}>
                {recentProjects.map((project, i) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className={styles.projectCard}
                    style={{ animationDelay: `${i * 0.07}s` }}
                  >
                    <div className={styles.cardTop}>
                      <span className={styles.deptBadge}>{project.department.code}</span>
                      <span className={styles.yearBadge}>{project.year}</span>
                    </div>
                    <h3 className={styles.cardTitle}>{project.title}</h3>
                    <p className={styles.cardAbstract}>
                      {project.abstract.slice(0, 140)}…
                    </p>
                    <div className={styles.cardTags}>
                      {project.tags.slice(0, 3).map((tag) => (
                        <span key={tag.id} className={styles.tag}>{tag.name}</span>
                      ))}
                    </div>
                    <div className={styles.cardFooter}>
                      <span className={styles.cardAuthor}>👤 {project.uploader.fullName}</span>
                      <span className={styles.cardPdf}>📄 PDF</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className={styles.ctaSection}>
          <div className={`container ${styles.ctaInner}`}>
            <div className={styles.ctaGlow} />
            <h2 className={styles.ctaTitle}>Ready to share your research?</h2>
            <p className={styles.ctaSubtitle}>
              Upload your final year project and contribute to Ethiopia&apos;s growing academic knowledge base.
            </p>
            <Link href="/register" className="btn btn-accent" id="cta-register-btn">
              Get Started — It&apos;s Free
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
