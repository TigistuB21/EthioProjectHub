import { prisma } from '@/lib/db';
import { getUserSession } from '@/lib/auth';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ReviewPanel from './ReviewPanel';
import styles from './project-detail.module.css';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;

  // 1. Fetch project with all relationships
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      department: true,
      tags: true,
      uploader: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          department: true
        }
      },
      approvals: {
        include: {
          reviewer: {
            select: {
              fullName: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  if (!project) {
    notFound();
  }

  // 2. Security / Authentication check for non-approved projects
  const session = await getUserSession();
  const isApproved = project.status === 'APPROVED';
  
  if (!isApproved) {
    if (!session) {
      // Not logged in and project is not approved, redirect to login
      redirect(`/login?returnUrl=/projects/${id}`);
    }

    const isOwner = project.uploaderId === session.id;
    const isReviewer = session.role === 'ADVISOR' || session.role === 'ADMIN';

    if (!isOwner && !isReviewer) {
      // Not authorized to view this draft
      return (
        <>
          <Navbar />
          <main className="container" style={{ paddingTop: '10rem', textAlign: 'center', minHeight: '80vh' }}>
            <div className="card" style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem' }}>
              <span style={{ fontSize: '3rem' }}>🔒</span>
              <h2 style={{ marginTop: '1rem' }}>Access Restricted</h2>
              <p style={{ color: 'hsl(var(--text-secondary))', margin: '1rem 0' }}>
                This project is currently pending approval and is only visible to the author and university advisors.
              </p>
              <Link href="/projects" className="btn btn-primary">Back to Repository</Link>
            </div>
          </main>
          <Footer />
        </>
      );
    }
  }

  // Determine uploader department name
  const uploaderDept = project.uploader.department?.name || 'Unspecified Department';

  return (
    <>
      <Navbar />
      <main className={`container ${styles.detailPage}`}>
        <Link href="/projects" className={styles.backLink}>
          ← Back to Projects
        </Link>

        <div className={styles.layout}>
          {/* Main Content Area */}
          <div className={styles.mainCard}>
            <div className={styles.headerInfo}>
              <div className={styles.badges}>
                <span className={styles.deptBadge}>{project.department.name}</span>
                <span className={styles.yearBadge}>Class of {project.year}</span>
              </div>
              
              {/* Show Status Badge for uploader or reviewers */}
              {(session && (project.uploaderId === session.id || session.role === 'ADVISOR' || session.role === 'ADMIN')) && (
                <span className={`${styles.statusBadge} ${
                  project.status === 'APPROVED' ? styles.statusApproved :
                  project.status === 'REJECTED' ? styles.statusRejected :
                  styles.statusPending
                }`}>
                  {project.status}
                </span>
              )}
            </div>

            <h1 className={styles.title}>{project.title}</h1>

            {/* Glowing AI Box (Gemini generated summary) */}
            {project.summary && (
              <div className={styles.aiSummaryBox}>
                <div className={styles.aiHeader}>
                  <span className={styles.aiIcon}>✨</span> AI-Generated Project Summary
                </div>
                <p className={styles.aiText}>“{project.summary}”</p>
              </div>
            )}

            {/* Project Metadata Details */}
            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Academic Year</span>
                <span className={styles.metaValue}>{project.year}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Department</span>
                <span className={styles.metaValue}>{project.department.name} ({project.department.code})</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Team Members</span>
                <span className={styles.metaValue}>{project.teamMembers}</span>
              </div>
            </div>

            {/* Abstract Section */}
            <h2 className={styles.sectionTitle}>Abstract</h2>
            <p className={styles.abstractText}>{project.abstract}</p>

            {/* Keywords/Tags */}
            <h2 className={styles.sectionTitle}>Keywords & Tags</h2>
            <div className={styles.tags}>
              {project.tags.map((tag) => (
                <span key={tag.id} className={styles.tag}>
                  #{tag.name}
                </span>
              ))}
            </div>

            {/* PDF View & Download section */}
            <section className={styles.pdfSection}>
              <div className={styles.pdfAction}>
                <h2 className={styles.sectionTitle} style={{ marginBottom: 0, border: 'none', padding: 0 }}>
                  📄 Project Document (PDF)
                </h2>
                <a
                  href={project.pdfUrl}
                  download={`${project.title.toLowerCase().replace(/\s+/g, '_')}.pdf`}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  📥 Download PDF
                </a>
              </div>
              
              <div className={styles.pdfViewerWrapper}>
                {/* Embed PDF directly, with a download fallback for unsupported browsers */}
                <object
                  data={project.pdfUrl}
                  type="application/pdf"
                  className={styles.pdfIframe}
                >
                  <div className={styles.pdfFallback}>
                    <span style={{ fontSize: '3rem' }}>📁</span>
                    <h3>PDF Preview Not Available</h3>
                    <p>Your browser doesn&apos;t support inline PDF rendering.</p>
                    <a href={project.pdfUrl} className="btn btn-primary" download>
                      Download PDF to View
                    </a>
                  </div>
                </object>
              </div>
            </section>
          </div>

          {/* Sidebar Area */}
          <div className={styles.sidebarCards}>
            {/* Author / Student Info */}
            <div className={styles.sidebarCard}>
              <h3 className={styles.sidebarCardTitle}>👤 Submitted By</h3>
              <div className={styles.authorDetails}>
                <div className={styles.authorInfoRow}>
                  <span className={styles.authorLabel}>Full Name</span>
                  <span className={styles.authorValue}>{project.uploader.fullName}</span>
                </div>
                <div className={styles.authorInfoRow}>
                  <span className={styles.authorLabel}>Email Address</span>
                  <span className={styles.authorValue}>{project.uploader.email}</span>
                </div>
                <div className={styles.authorInfoRow}>
                  <span className={styles.authorLabel}>Major / Department</span>
                  <span className={styles.authorValue}>{uploaderDept}</span>
                </div>
              </div>
            </div>

            {/* Review Controls (Advisors & Admins only, when PENDING) */}
            {session && (session.role === 'ADVISOR' || session.role === 'ADMIN') && project.status === 'PENDING' && (
              <ReviewPanel projectId={project.id} />
            )}

            {/* Review History Logs (Only visible to owner, advisors, or admins) */}
            {project.approvals.length > 0 && session && (project.uploaderId === session.id || session.role === 'ADVISOR' || session.role === 'ADMIN') && (
              <div className={styles.sidebarCard}>
                <h3 className={styles.sidebarCardTitle}>📜 Review Log History</h3>
                <div className={styles.logList}>
                  {project.approvals.map((approval) => (
                    <div key={approval.id} className={styles.logItem}>
                      <div className={styles.logMeta}>
                        Reviewed by <strong style={{ color: 'hsl(var(--text-primary))' }}>{approval.reviewer.fullName}</strong> ({approval.reviewer.role.toLowerCase()})
                      </div>
                      <div>
                        Status: <span className={`${styles.logStatus} ${approval.status === 'APPROVED' ? styles.statusApproved : styles.statusRejected}`} style={{ padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>{approval.status}</span>
                      </div>
                      {approval.feedback && (
                        <p className={styles.logFeedback}>“{approval.feedback}”</p>
                      )}
                      <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>
                        {new Date(approval.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
