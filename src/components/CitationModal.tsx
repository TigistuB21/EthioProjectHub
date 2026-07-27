'use client';

import { useState } from 'react';

interface ProjectCitationProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    title: string;
    year: number;
    uploaderName: string;
    universityName: string;
    departmentName: string;
    url: string;
  };
}

export default function CitationModal({ isOpen, onClose, project }: ProjectCitationProps) {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const authors = project.uploaderName;
  const year = project.year;
  const title = project.title;
  const univ = project.universityName || "Ethiopian Higher Education Institution";
  const dept = project.departmentName || "Department";

  // Formats
  const apa = `${authors}. (${year}). ${title} [Bachelor's/Master's thesis, ${univ}]. EthioProjectHub Repository. ${project.url}`;
  
  const ieee = `${authors}, "${title}," B.S./M.S. thesis, Dept. of ${dept}, ${univ}, ${year}. [Online]. Available: ${project.url}`;
  
  const harvard = `${authors} (${year}) '${title}', Department of ${dept}, ${univ}. Available at: ${project.url} (Accessed: ${new Date().toLocaleDateString()}).`;

  const bibtex = `@thesis{project_${project.year}_${authors.replace(/\s+/g, '_').toLowerCase()},
  author    = {${authors}},
  title     = {${title}},
  school    = {${univ}},
  department= {${dept}},
  year      = {${year}},
  type      = {Academic Thesis/Capstone},
  url       = {${project.url}}
}`;

  const handleCopy = (text: string, format: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📜 Cite This Paper
          </h2>
          <button onClick={onClose} style={closeBtnStyle} aria-label="Close modal">✕</button>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-secondary))', marginBottom: '1.25rem' }}>
          Select your preferred academic citation format below to copy to your clipboard:
        </p>

        {/* APA 7 */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span style={{ fontWeight: 600 }}>APA (7th Edition)</span>
            <button
              onClick={() => handleCopy(apa, 'APA')}
              style={copiedFormat === 'APA' ? copiedBtnStyle : copyBtnStyle}
            >
              {copiedFormat === 'APA' ? '✓ Copied!' : 'Copy APA'}
            </button>
          </div>
          <div style={codeBlockStyle}>{apa}</div>
        </div>

        {/* IEEE */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span style={{ fontWeight: 600 }}>IEEE</span>
            <button
              onClick={() => handleCopy(ieee, 'IEEE')}
              style={copiedFormat === 'IEEE' ? copiedBtnStyle : copyBtnStyle}
            >
              {copiedFormat === 'IEEE' ? '✓ Copied!' : 'Copy IEEE'}
            </button>
          </div>
          <div style={codeBlockStyle}>{ieee}</div>
        </div>

        {/* Harvard */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span style={{ fontWeight: 600 }}>Harvard</span>
            <button
              onClick={() => handleCopy(harvard, 'Harvard')}
              style={copiedFormat === 'Harvard' ? copiedBtnStyle : copyBtnStyle}
            >
              {copiedFormat === 'Harvard' ? '✓ Copied!' : 'Copy Harvard'}
            </button>
          </div>
          <div style={codeBlockStyle}>{harvard}</div>
        </div>

        {/* BibTeX */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <span style={{ fontWeight: 600 }}>BibTeX</span>
            <button
              onClick={() => handleCopy(bibtex, 'BibTeX')}
              style={copiedFormat === 'BibTeX' ? copiedBtnStyle : copyBtnStyle}
            >
              {copiedFormat === 'BibTeX' ? '✓ Copied!' : 'Copy BibTeX'}
            </button>
          </div>
          <pre style={{ ...codeBlockStyle, fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>{bibtex}</pre>
        </div>

        <div style={{ textAlign: 'right', marginTop: '1rem' }}>
          <button onClick={onClose} className="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: '1rem'
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'hsl(222 47% 11%)',
  border: '1px solid hsl(217 33% 20%)',
  borderRadius: '12px',
  width: '100%',
  maxWidth: '640px',
  maxHeight: '90vh',
  overflowY: 'auto',
  padding: '1.5rem',
  color: 'hsl(var(--text-primary))',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
  borderBottom: '1px solid hsl(217 33% 20%)',
  paddingBottom: '0.75rem'
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'hsl(var(--text-secondary))',
  fontSize: '1.25rem',
  cursor: 'pointer'
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '1.25rem'
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '0.4rem',
  fontSize: '0.9rem'
};

const copyBtnStyle: React.CSSProperties = {
  padding: '0.25rem 0.6rem',
  fontSize: '0.75rem',
  borderRadius: '4px',
  border: '1px solid hsl(217 33% 30%)',
  backgroundColor: 'hsl(217 33% 17%)',
  color: 'hsl(var(--text-primary))',
  cursor: 'pointer'
};

const copiedBtnStyle: React.CSSProperties = {
  ...copyBtnStyle,
  backgroundColor: 'hsl(142 71% 25%)',
  borderColor: 'hsl(142 71% 40%)',
  color: '#fff'
};

const codeBlockStyle: React.CSSProperties = {
  backgroundColor: 'hsl(222 47% 7%)',
  border: '1px solid hsl(217 33% 18%)',
  borderRadius: '6px',
  padding: '0.75rem',
  fontSize: '0.85rem',
  color: 'hsl(var(--text-primary))',
  lineHeight: '1.4'
};
