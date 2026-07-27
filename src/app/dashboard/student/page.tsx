import { prisma } from '@/lib/db';
import { getUserSession } from '@/lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from '../dashboard.module.css';

export default async function StudentDashboardPage() {
  // 1. Get Session
  const session = await getUserSession();
  if (!session) {
    redirect('/login');
  }

  // Double check that uploader role is STUDENT (or ADVISOR if they choose, but we restrict dashboard)
  if (session.role !== 'STUDENT') {
    if (session.role === 'ADVISOR') {
      redirect('/dashboard/advisor');
    } else if (session.role === 'ADMIN') {
      redirect('/dashboard/admin');
    }
  }

  // 2. Fetch User with Department details
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { department: true }
  });

  if (!user) {
    redirect('/login');
  }

  // 3. Fetch User's Projects and Linked Co-authored Projects
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { uploaderId: session.id },
        { coAuthorEmails: { contains: session.email } }
      ]
    },
    include: { department: true, tags: true, approvals: { orderBy: { createdAt: 'desc' }, take: 1 } },
    orderBy: { createdAt: 'desc' }
  });

  // Calculate statistics
  const totalUploads = projects.length;
  const approvedCount = projects.filter((p) => p.status === 'APPROVED').length;
  const pendingCount = projects.filter((p) => p.status === 'PENDING').length;
  const revisionCount = projects.filter((p) => p.status === 'REVISION_REQUESTED' || p.status === 'REJECTED').length;

  const departmentName = user.department?.name || 'Unspecified Department';

  return (
    <>
      <Navbar />
      <main className={`container ${styles.dashboard}`}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h1>Student Dashboard</h1>
            <p>Manage and track the progress of your final year project submissions.</p>
          </div>
          <div className={styles.actionsArea}>
            <Link href="/dashboard/student/upload" className="btn btn-primary">
              ⬆️ Upload New Project
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📂</span>
            <div className={styles.statDetails}>
              <span className={styles.statNumber}>{totalUploads}</span>
              <span className={styles.statLabel}>Total Uploaded</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon} style={{ color: 'hsl(142 69% 45%)' }}>✅</span>
            <div className={styles.statDetails}>
              <span className={styles.statNumber}>{approvedCount}</span>
              <span className={styles.statLabel}>Approved</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon} style={{ color: 'hsl(45 93% 52%)' }}>⏳</span>
            <div className={styles.statDetails}>
              <span className={styles.statNumber}>{pendingCount}</span>
              <span className={styles.statLabel}>Pending Review</span>
            </div>
          </div>
          {revisionCount > 0 && (
            <div className={styles.statCard}>
              <span className={styles.statIcon} style={{ color: 'hsl(0 84% 65%)' }}>📝</span>
              <div className={styles.statDetails}>
                <span className={styles.statNumber}>{revisionCount}</span>
                <span className={styles.statLabel}>Needs Revision</span>
              </div>
            </div>
          )}
        </div>

        {/* Layout Grid */}
        <div className={styles.layout}>
          {/* Left profile sidebar */}
          <aside className={styles.sidebarCard}>
            <div className={styles.avatar}>
              {user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <h2 className={styles.userName}>{user.fullName}</h2>
            <span className={styles.userRole}>{user.role}</span>

            <div className={styles.profileMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Email Address</span>
                <span className={styles.metaValue}>{user.email}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Department</span>
                <span className={styles.metaValue}>{departmentName}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Member Since</span>
                <span className={styles.metaValue}>
                  {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                </span>
              </div>
            </div>
          </aside>

          {/* Right Main Panel */}
          <section className={styles.contentCard}>
            <div className={styles.contentCardTitle}>
              <span>📁 Your Uploaded Projects</span>
            </div>

            {projects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📂</span>
                <h3>No Projects Uploaded Yet</h3>
                <p style={{ color: 'hsl(var(--text-secondary))', marginBottom: '1.5rem' }}>
                  You haven&apos;t uploaded any final year projects to the repository yet.
                </p>
                <Link href="/dashboard/student/upload" className="btn btn-primary">
                  Upload Your First Project
                </Link>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Project Title</th>
                      <th>Department</th>
                      <th>Year</th>
                      <th>Status</th>
                      <th>Date Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr key={project.id}>
                        <td>
                          <Link href={`/projects/${project.id}`} className={styles.projectTitle} title={project.title}>
                            {project.title}
                          </Link>
                        </td>
                        <td>{project.department.code}</td>
                        <td>{project.year}</td>
                        <td>
                          <span className={`${styles.badge} ${
                            project.status === 'APPROVED' ? styles.badgeApproved :
                            (project.status === 'REJECTED' || project.status === 'REVISION_REQUESTED') ? styles.badgeRejected :
                            styles.badgePending
                          }`}>
                            {project.status === 'REVISION_REQUESTED' ? 'REVISION REQUESTED' : project.status}
                          </span>
                        </td>
                        <td>
                          {new Date(project.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <Link href={`/projects/${project.id}`} className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
                            🔍 View Details
                          </Link>
                          {(project.status === 'REVISION_REQUESTED' || project.status === 'REJECTED') && (
                            <Link href={`/projects/${project.id}/resubmit`} className="btn btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', backgroundColor: 'hsl(45 93% 42%)', color: '#fff' }}>
                              📝 Resubmit Revision
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
