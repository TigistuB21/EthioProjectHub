'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import styles from '../../dashboard.module.css';

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function StudentUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [teamMembers, setTeamMembers] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // UI / Fetching States
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 1. Fetch departments and current user to pre-select department
  useEffect(() => {
    async function loadInitialData() {
      try {
        // Fetch departments
        const deptRes = await fetch('/api/departments');
        const deptData = await deptRes.json();
        if (deptData.departments) {
          setDepartments(deptData.departments);
        }

        // Fetch current user details
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.user?.departmentId) {
            setDepartmentId(meData.user.departmentId);
          }
        }
      } catch (err) {
        console.error('Failed to load initial upload data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // 2. Drag and drop file handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    // Validate file type
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setError('Please select a valid PDF document.');
      return;
    }
    // Validate file size (15MB)
    if (file.size > 15 * 1024 * 1024) {
      setError('File size exceeds the 15MB limit.');
      return;
    }
    setPdfFile(file);
  };

  const removeFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPdfFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 3. Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Frontend validations
    if (!title.trim() || !abstract.trim() || !departmentId || !year || !teamMembers.trim() || !pdfFile) {
      setError('Please fill in all fields and select a PDF file.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('abstract', abstract.trim());
      formData.append('departmentId', departmentId);
      formData.append('year', year);
      formData.append('teamMembers', teamMembers.trim());
      formData.append('pdfFile', pdfFile);

      const res = await fetch('/api/projects/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload project');
      }

      setSuccess('Project uploaded successfully! Analyzing abstract with Gemini...');
      
      // Short delay for better UX flow, then redirect
      setTimeout(() => {
        router.push('/dashboard/student');
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.');
      setSubmitting(false);
    }
  };

  // Last 10 years for dropdown
  const currentYear = new Date().getFullYear();
  const academicYears = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <>
      <Navbar />
      <main className={`container ${styles.dashboard}`}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <h1>Upload Project</h1>
            <p>Publish your final year project. Gemini AI will auto-extract tags and summarize it.</p>
          </div>
          <div className={styles.actionsArea}>
            <Link href="/dashboard/student" className="btn btn-secondary">
              ← Cancel & Back
            </Link>
          </div>
        </div>

        {/* Content Card */}
        <div className={styles.contentCard} style={{ maxWidth: '800px', margin: '0 auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div className="spinner" style={{ margin: '0 auto 1.5rem' }}></div>
              <p>Loading form parameters...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.uploadForm}>
              {error && (
                <div className="badge badge-rejected" style={{ padding: '0.75rem', width: '100%', textAlign: 'center', borderRadius: '6px' }}>
                  ⚠️ {error}
                </div>
              )}
              {success && (
                <div className="badge badge-approved" style={{ padding: '0.75rem', width: '100%', textAlign: 'center', borderRadius: '6px' }}>
                  ✨ {success}
                </div>
              )}

              {/* Form Grid */}
              <div className={styles.formGrid}>
                {/* Title */}
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label htmlFor="upload-title">Project Title</label>
                  <input
                    id="upload-title"
                    type="text"
                    className={styles.input}
                    placeholder="Enter the official final year project title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                {/* Department */}
                <div className={styles.formGroup}>
                  <label htmlFor="upload-dept">Department</label>
                  <select
                    id="upload-dept"
                    className={styles.select}
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    disabled={submitting}
                    required
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year */}
                <div className={styles.formGroup}>
                  <label htmlFor="upload-year">Graduation Year</label>
                  <select
                    id="upload-year"
                    className={styles.select}
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    disabled={submitting}
                    required
                  >
                    {academicYears.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Team Members */}
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label htmlFor="upload-members">Team Members (Comma separated names)</label>
                  <input
                    id="upload-members"
                    type="text"
                    className={styles.input}
                    placeholder="e.g. Natnael Tesfaye, Abel Girma, Kidus Daniel"
                    value={teamMembers}
                    onChange={(e) => setTeamMembers(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                {/* Abstract */}
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label htmlFor="upload-abstract">Project Abstract</label>
                  <textarea
                    id="upload-abstract"
                    className={styles.textarea}
                    placeholder="Paste the project abstract or a detailed overview here. Gemini AI uses this abstract to generate tags and summary."
                    value={abstract}
                    onChange={(e) => setAbstract(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                {/* File Dropzone */}
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label>Upload PDF Document (Max 15MB)</label>
                  
                  <input
                    ref={fileInputRef}
                    id="pdf-file-input"
                    type="file"
                    accept="application/pdf"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    disabled={submitting}
                  />

                  <div
                    className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => !pdfFile && fileInputRef.current?.click()}
                  >
                    <span className={styles.dropzoneIcon}>📄</span>
                    {pdfFile ? (
                      <div>
                        <div className={styles.dropzoneTitle}>Selected Document</div>
                        <div className={styles.fileBadge}>
                          {pdfFile.name} ({Math.round(pdfFile.size / 1024 / 1024 * 100) / 100} MB)
                          <span onClick={removeFile} className={styles.fileBadgeRemove} title="Remove File">
                            &nbsp;✕
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className={styles.dropzoneTitle}>Drag and drop your PDF here</div>
                        <div className={styles.dropzoneDesc}>or click to browse files on your computer</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Link href="/dashboard/student" className="btn btn-secondary">
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Uploading & Analyzing...' : '🚀 Submit Project'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
