import { prisma } from '@/lib/db';
import { getUserSession } from '@/lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import UserManagementTable from './UserManagementTable';
import DepartmentManager from './DepartmentManager';
import styles from '../dashboard.module.css';

export default async function AdminDashboardPage() {
  // 1. Get Session & Authenticate
  const session = await getUserSession();
  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'ADMIN' && session.role !== 'UNIVERSITY_ADMIN') {
    redirect('/dashboard/student');
  }

  // 2. Fetch admin user profile details
  const adminUser = await prisma.user.findUnique({
    where: { id: session.id },
    include: { department: true, university: true }
  });

  if (!adminUser) {
    redirect('/login');
  }

  const isUnivAdmin = session.role === 'UNIVERSITY_ADMIN';
  const targetUnivId = isUnivAdmin ? adminUser.universityId : null;

  // 3. Fetch users, departments, and projects for management
  const [users, departments, projects] = await Promise.all([
    prisma.user.findMany({
      where: targetUnivId ? { universityId: targetUnivId } : {},
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        departmentId: true,
      }
    }),
    prisma.department.findMany({
      where: targetUnivId ? { universityId: targetUnivId } : {},
      orderBy: { name: 'asc' }
    }),
    prisma.project.findMany({
      where: targetUnivId ? { department: { universityId: targetUnivId } } : {},
      include: {
        department: true,
        uploader: {
          select: { fullName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  // Calculations for Admin Global Stats
  const totalUsers = users.length;
  const totalProjects = projects.length;
  const approvedProjects = projects.filter((p) => p.status === 'APPROVED').length;
  const pendingReviews = projects.filter((p) => p.status === 'PENDING').length;

  return (
    <>
      <Navbar />
      <main className={`container ${styles.dashboard}`}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h1>Administrator Workspace</h1>
            <p>System-wide user control, university departments, and project metadata overrides.</p>
          </div>
          <div className={styles.actionsArea}>
            <Link href="/projects" className="btn btn-secondary">
              🔍 View Live Repository
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>👥</span>
            <div className={styles.statDetails}>
              <span className={styles.statNumber}>{totalUsers}</span>
              <span className={styles.statLabel}>Total Users</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📁</span>
            <div className={styles.statDetails}>
              <span className={styles.statNumber}>{totalProjects}</span>
              <span className={styles.statLabel}>Total Submissions</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon} style={{ color: 'hsl(142 69% 45%)' }}>✅</span>
            <div className={styles.statDetails}>
              <span className={styles.statNumber}>{approvedProjects}</span>
              <span className={styles.statLabel}>Approved Projects</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon} style={{ color: 'hsl(45 93% 52%)' }}>⏳</span>
            <div className={styles.statDetails}>
              <span className={styles.statNumber}>{pendingReviews}</span>
              <span className={styles.statLabel}>Pending Reviews</span>
            </div>
          </div>
        </div>

        {/* Layout Grid */}
        <div className={styles.layout}>
          {/* Left Profile Sidebar */}
          <aside className={styles.sidebarCard}>
            <div className={styles.avatar}>
              {adminUser.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <h2 className={styles.userName}>{adminUser.fullName}</h2>
            <span className={styles.userRole} style={{ background: 'hsl(var(--accent) / 10%)', color: 'hsl(var(--accent))', borderColor: 'hsl(var(--accent) / 20%)' }}>
              {adminUser.role}
            </span>

            <div className={styles.profileMeta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Admin Email</span>
                <span className={styles.metaValue}>{adminUser.email}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>System Authority</span>
                <span className={styles.metaValue}>Full Root Control</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Last Managed</span>
                <span className={styles.metaValue}>Just now</span>
              </div>
            </div>
          </aside>

          {/* Right Workspaces */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            
            {/* Section 1: User Management */}
            <section className={styles.contentCard}>
              <div className={styles.contentCardTitle}>
                <span>👥 User Management & Role Authorization</span>
              </div>
              <UserManagementTable users={users} departments={departments} />
            </section>

            {/* Section 2: Department Management */}
            <section className={styles.contentCard}>
              <div className={styles.contentCardTitle}>
                <span>🏢 Academic Departments</span>
              </div>
              <DepartmentManager initialDepartments={departments} />
            </section>

            {/* Section 3: Projects Audit Trail */}
            <section className={styles.contentCard}>
              <div className={styles.contentCardTitle}>
                <span>📁 System-Wide Project Submissions Audit</span>
              </div>
              {projects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'hsl(var(--text-muted))' }}>
                  <p>No projects submitted yet.</p>
                </div>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Project Title</th>
                        <th>Author</th>
                        <th>Department</th>
                        <th>Year</th>
                        <th>Status</th>
                        <th>Action</th>
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
                          <td>{project.uploader.fullName}</td>
                          <td>{project.department.code}</td>
                          <td>{project.year}</td>
                          <td>
                            <span className={`${styles.badge} ${
                              project.status === 'APPROVED' ? styles.badgeApproved :
                              project.status === 'REJECTED' ? styles.badgeRejected :
                              styles.badgePending
                            }`}>
                              {project.status}
                            </span>
                          </td>
                          <td>
                            <Link href={`/projects/${project.id}`} className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
                              Inspect
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
