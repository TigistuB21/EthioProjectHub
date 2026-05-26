import { prisma } from '@/lib/db';
import { getUserSession } from '@/lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from '../dashboard.module.css';

export default async function AdvisorDashboardPage() {
  // 1. Get Session
  const session = await getUserSession();
  if (!session) {
    redirect('/login');
  }

  // Ensure role is ADVISOR or ADMIN
  if (session.role !== 'ADVISOR' && session.role !== 'ADMIN') {
    redirect('/dashboard/student');
  }

  // If ADMIN, redirect to Admin dashboard
  if (session.role === 'ADMIN') {
    redirect('/dashboard/admin');
  }

  // 2. Fetch User with Department Details
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { department: true }
  });

  if (!user) {
    redirect('/login');
  }

  const deptId = user.departmentId;
  const departmentName = user.department?.name || 'All Departments (Unassigned)';

  // 3. Fetch Pending Projects in Advisor's Department
  const pendingProjects = deptId
    ? await prisma.project.findMany({
        where: { departmentId: deptId, status: 'PENDING' },
        include: { uploader: true },
        orderBy: { createdAt: 'desc' }
      })
    : [];

  // 4. Fetch Reviewed/Archived Projects in Department (Approved/Rejected)
  const archivedProjects = deptId
    ? await prisma.project.findMany({
        where: {
          departmentId: deptId,
          status: { in: ['APPROVED', 'REJECTED'] }
        },
        include: { uploader: true },
        orderBy: { updatedAt: 'desc' },
        take: 15
      })
    : [];

  // Calculate Department Statistics
  const pendingCount = deptId
    ? await prisma.project.count({
        where: { departmentId: deptId, status: 'PENDING' }
      })
    : 0;

  const approvedCount = deptId
    ? await prisma.project.count({
        where: { departmentId: deptId, status: 'APPROVED' }
      })
    : 0;

  const totalDeptProjects = deptId
    ? await prisma.project.count({
        where: { departmentId: deptId }
      })
    : 0;

  return (
    <>
      <Navbar />
      <main className={`container ${styles.dashboard}`}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h1>Advisor Review Panel</h1>
            <p>Department of {departmentName}</p>
          </div>
          <div className={styles.actionsArea}>
            <Link href="/projects" className="btn btn-secondary">
              🔍 Browse Public Repository
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statIcon} style={{ color: 'hsl(45 93% 52%)' }}>⏳</span>
            <div className={styles.statDetails}>
              <span className={styles.statNumber}>{pendingCount}</span>
              <span className={styles.statLabel}>Pending Reviews</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon} style={{ color: 'hsl(142 69% 45%)' }}>✅</span>
            <div className={styles.statDetails}>
              <span className={styles.statNumber}>{approvedCount}</span>
              <span className={styles.statLabel}>Approved Projects</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📊</span>
            <div className={styles.statDetails}>
              <span className={styles.statNumber}>{totalDeptProjects}</span>
              <span className={styles.statLabel}>Total Dept Submissions</span>
            </div>
          </div>
        </div>

        {/* Layout Grid */}
        <div className={styles.layout}>
          {/* Profile Sidebar */}
          <aside className={styles.sidebarCard}>
            <div className={styles.avatar}>
              {user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <h2 className={styles.userName}>{user.fullName}</h2>
            <span className={styles.userRole}>{user.role}</span>

            <div className={styles.profileMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Advisor Email</span>
                <span className={styles.metaValue}>{user.email}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Department Scope</span>
                <span className={styles.metaValue}>{departmentName}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Reviewer Authority</span>
                <span className={styles.metaValue}>Verify & Publish FYPs</span>
              </div>
            </div>
          </aside>

          {/* Main Workspace Panels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            {/* 1. Pending Approvals Panel */}
            <section className={styles.contentCard}>
              <div className={styles.contentCardTitle}>
                <span>⏳ Pending Submissions ({pendingProjects.length})</span>
              </div>

              {pendingProjects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.75rem' }}>🎉</span>
                  <h3>All Caught Up!</h3>
                  <p style={{ color: 'hsl(var(--text-secondary))' }}>
                    There are no pending final year projects waiting for review in your department.
                  </p>
                </div>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Project Title</th>
                        <th>Submitted By</th>
                        <th>Year</th>
                        <th>Submitted On</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingProjects.map((project) => (
                        <tr key={project.id}>
                          <td>
                            <Link href={`/projects/${project.id}`} className={styles.projectTitle} title={project.title}>
                              {project.title}
                            </Link>
                          </td>
                          <td>{project.uploader.fullName}</td>
                          <td>{project.year}</td>
                          <td>
                            {new Date(project.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td>
                            <Link href={`/projects/${project.id}`} className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                              ✍️ Review Submission
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* 2. Decisions Archives Panel */}
            <section className={styles.contentCard}>
              <div className={styles.contentCardTitle}>
                <span>📜 Recent Department Decisions</span>
              </div>

              {archivedProjects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'hsl(var(--text-muted))' }}>
                  <p>No historical decisions recorded yet.</p>
                </div>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Project Title</th>
                        <th>Submitted By</th>
                        <th>Year</th>
                        <th>Decision Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {archivedProjects.map((project) => (
                        <tr key={project.id}>
                          <td>
                            <Link href={`/projects/${project.id}`} className={styles.projectTitle} title={project.title}>
                              {project.title}
                            </Link>
                          </td>
                          <td>{project.uploader.fullName}</td>
                          <td>{project.year}</td>
                          <td>
                            <span className={`${styles.badge} ${
                              project.status === 'APPROVED' ? styles.badgeApproved : styles.badgeRejected
                            }`}>
                              {project.status}
                            </span>
                          </td>
                          <td>
                            <Link href={`/projects/${project.id}`} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                              🔍 View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
