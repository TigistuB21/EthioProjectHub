'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from './projects.module.css';

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Tag {
  id: string;
  name: string;
}

interface University {
  id: string;
  name: string;
  code: string;
}

interface TagItem {
  id: string;
  name: string;
  count: number;
}

interface Project {
  id: string;
  title: string;
  abstract: string;
  summary: string | null;
  year: number;
  pdfUrl: string;
  teamMembers: string;
  createdAt: string;
  department: Department;
  tags: Tag[];
  uploader: {
    fullName: string;
  };
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function ProjectsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Search filter states synchronized with URL
  const query = searchParams.get('q') || '';
  const departmentId = searchParams.get('departmentId') || 'all';
  const universityId = searchParams.get('universityId') || 'all';
  const selectedTag = searchParams.get('tag') || 'all';
  const year = searchParams.get('year') || 'all';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // UI inputs states
  const [searchInput, setSearchInput] = useState(query);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [popularTags, setPopularTags] = useState<TagItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch metadata on mount
  useEffect(() => {
    async function fetchMetadata() {
      try {
        const [deptRes, univRes, tagRes] = await Promise.all([
          fetch('/api/departments'),
          fetch('/api/universities'),
          fetch('/api/tags')
        ]);
        
        const deptData = await deptRes.json();
        const univData = await univRes.json();
        const tagData = await tagRes.json();

        if (deptData.departments) setDepartments(deptData.departments);
        if (univData.universities) setUniversities(univData.universities);
        if (tagData.tags) setPopularTags(tagData.tags);
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    }
    fetchMetadata();
  }, []);

  // Fetch projects whenever URL filters change
  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (departmentId !== 'all') params.set('departmentId', departmentId);
        if (universityId !== 'all') params.set('universityId', universityId);
        if (selectedTag !== 'all') params.set('tag', selectedTag);
        if (year !== 'all') params.set('year', year);
        if (sort !== 'newest') params.set('sort', sort);
        params.set('page', page.toString());
        params.set('limit', '9');
        params.set('status', 'APPROVED');

        const res = await fetch(`/api/projects?${params.toString()}`);
        if (!res.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data = await res.json();
        setProjects(data.projects || []);
        setPagination(data.pagination || null);
      } catch (err) {
        setError('Could not load projects. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [query, departmentId, universityId, selectedTag, year, sort, page]);

  // Handle filter changes by updating URL
  const updateUrl = (newFilters: { 
    q?: string; 
    departmentId?: string; 
    universityId?: string;
    tag?: string;
    year?: string; 
    sort?: string;
    page?: number 
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newFilters.q !== undefined) {
      if (newFilters.q) params.set('q', newFilters.q);
      else params.delete('q');
    }
    if (newFilters.departmentId !== undefined) {
      if (newFilters.departmentId && newFilters.departmentId !== 'all') params.set('departmentId', newFilters.departmentId);
      else params.delete('departmentId');
    }
    if (newFilters.universityId !== undefined) {
      if (newFilters.universityId && newFilters.universityId !== 'all') params.set('universityId', newFilters.universityId);
      else params.delete('universityId');
    }
    if (newFilters.tag !== undefined) {
      if (newFilters.tag && newFilters.tag !== 'all') params.set('tag', newFilters.tag);
      else params.delete('tag');
    }
    if (newFilters.year !== undefined) {
      if (newFilters.year && newFilters.year !== 'all') params.set('year', newFilters.year);
      else params.delete('year');
    }
    if (newFilters.sort !== undefined) {
      if (newFilters.sort && newFilters.sort !== 'newest') params.set('sort', newFilters.sort);
      else params.delete('sort');
    }
    if (newFilters.page !== undefined) {
      params.set('page', newFilters.page.toString());
    } else {
      params.set('page', '1');
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ q: searchInput });
  };

  const handleReset = () => {
    setSearchInput('');
    router.push(pathname);
  };

  const currentYear = new Date().getFullYear();
  const academicYears = Array.from({ length: 15 }, (_, i) => currentYear - i);

  return (
    <div className={`container ${styles.projectsPage}`}>
      <div className={styles.pageHeader}>
        <h1>Project Repository</h1>
        <p>Explore verified final year projects from university students across Ethiopia.</p>
      </div>

      <div className={styles.layout}>
        {/* Sidebar Filters */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTitle}>
            <span>⚙️</span> Search & Filters
          </div>

          <form onSubmit={handleSearchSubmit}>
            <div className={styles.filterGroup}>
              <label htmlFor="search-input">Search Keywords</label>
              <div className={styles.searchInputWrapper}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  id="search-input"
                  type="text"
                  placeholder="Title, abstract, tags..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="univ-select">University</label>
              <select
                id="univ-select"
                value={universityId}
                onChange={(e) => updateUrl({ universityId: e.target.value })}
                className={styles.selectInput}
              >
                <option value="all">All Universities</option>
                {universities.map((univ) => (
                  <option key={univ.id} value={univ.id}>
                    {univ.name} ({univ.code})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="dept-select">Department</label>
              <select
                id="dept-select"
                value={departmentId}
                onChange={(e) => updateUrl({ departmentId: e.target.value })}
                className={styles.selectInput}
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="year-select">Academic Year</label>
              <select
                id="year-select"
                value={year}
                onChange={(e) => updateUrl({ year: e.target.value })}
                className={styles.selectInput}
              >
                <option value="all">All Years</option>
                {academicYears.map((y) => (
                  <option key={y} value={y.toString()}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '0.5rem' }}>
              Apply Search
            </button>

            {(query || departmentId !== 'all' || universityId !== 'all' || selectedTag !== 'all' || year !== 'all' || searchInput) && (
              <button type="button" onClick={handleReset} className={styles.resetBtn}>
                Clear All Filters
              </button>
            )}
          </form>

          {/* Popular Tag Pills */}
          {popularTags.length > 0 && (
            <div className={styles.tagPillsWrapper}>
              <div className={styles.tagPillsHeader}>🏷️ Popular Tags</div>
              <div className={styles.tagPills}>
                {popularTags.map((t) => {
                  const isActive = selectedTag === t.name;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => updateUrl({ tag: isActive ? 'all' : t.name })}
                      className={`${styles.tagPill} ${isActive ? styles.tagPillActive : ''}`}
                    >
                      #{t.name} ({t.count})
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* Content Section */}
        <section className={styles.contentArea}>
          <div className={styles.resultsHeader}>
            <div className={styles.resultsCount}>
              {loading ? (
                'Searching...'
              ) : (
                <>
                  Showing <strong>{projects.length}</strong> of{' '}
                  <strong>{pagination?.total || 0}</strong> projects
                </>
              )}
            </div>

            {/* Sort Order Selector */}
            <div className={styles.sortControls}>
              <label htmlFor="sort-select" style={{ fontSize: '0.85rem' }}>Sort by:</label>
              <select
                id="sort-select"
                value={sort}
                onChange={(e) => updateUrl({ sort: e.target.value })}
                className={styles.sortSelect}
              >
                <option value="newest">Newest Uploaded</option>
                <option value="oldest">Oldest Uploaded</option>
                <option value="year_desc">Academic Year (High to Low)</option>
                <option value="year_asc">Academic Year (Low to High)</option>
              </select>
            </div>
          </div>

          {error && <div className="badge badge-rejected" style={{ padding: '1rem', width: '100%', textAlign: 'center' }}>{error}</div>}

          {/* Grid of Results */}
          {loading ? (
            <div className={styles.loadingGrid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={styles.skeletonText} style={{ width: '40%' }} />
                  <div className={styles.skeletonText + ' ' + styles.title} />
                  <div className={styles.skeletonText + ' ' + styles.abstract1} />
                  <div className={styles.skeletonText + ' ' + styles.abstract2} />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <div className={styles.skeletonText + ' ' + styles.tag} />
                    <div className={styles.skeletonText + ' ' + styles.tag} />
                  </div>
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🔍</span>
              <h3>No Projects Found</h3>
              <p>Try modifying your keywords or adjusting the department filter.</p>
              <button onClick={handleReset} className="btn btn-secondary">
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              <div className={styles.projectGrid}>
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className={styles.projectCard}
                  >
                    <div className={styles.cardTop}>
                      <span className={styles.deptBadge}>{project.department.code}</span>
                      <span className={styles.yearBadge}>{project.year}</span>
                    </div>
                    <h3 className={styles.cardTitle} title={project.title}>
                      {project.title}
                    </h3>
                    <p className={styles.cardAbstract}>
                      {project.summary || project.abstract}
                    </p>
                    <div className={styles.cardTags}>
                      {project.tags.slice(0, 3).map((tag) => (
                        <span key={tag.id} className={styles.tag}>
                          {tag.name}
                        </span>
                      ))}
                      {project.tags.length > 3 && (
                        <span className={styles.tag}>+{project.tags.length - 3}</span>
                      )}
                    </div>
                    <div className={styles.cardFooter}>
                      <span className={styles.cardAuthor}>👤 {project.uploader.fullName}</span>
                      <span className={styles.cardPdf}>📄 PDF Link</span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination controls */}
              {pagination && pagination.totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => updateUrl({ page: page - 1 })}
                    disabled={page === 1}
                    className={styles.paginationBtn}
                  >
                    ◀ Prev
                  </button>
                  <span className={styles.pageInfo}>
                    Page {page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => updateUrl({ page: page + 1 })}
                    disabled={page === pagination.totalPages}
                    className={styles.paginationBtn}
                  >
                    Next ▶
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh' }}>
        <Suspense fallback={
          <div className="container" style={{ paddingTop: '8rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '3rem auto' }}></div>
            <p>Loading projects interface...</p>
          </div>
        }>
          <ProjectsContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
