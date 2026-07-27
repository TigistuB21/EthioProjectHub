'use client';

import { useState } from 'react';
import CitationModal from '@/components/CitationModal';

interface ProjectHeaderActionsProps {
  project: {
    id: string;
    title: string;
    year: number;
    uploaderName: string;
    universityName: string;
    departmentName: string;
  };
}

export default function ProjectHeaderActions({ project }: ProjectHeaderActionsProps) {
  const [citationModalOpen, setCitationModalOpen] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://ethioprojecthub.edu.et/projects/${project.id}`;

  return (
    <>
      <button
        onClick={() => setCitationModalOpen(true)}
        className="btn btn-secondary"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.4rem 0.85rem',
          fontSize: '0.85rem',
          cursor: 'pointer'
        }}
      >
        📜 Cite Paper
      </button>

      <CitationModal
        isOpen={citationModalOpen}
        onClose={() => setCitationModalOpen(false)}
        project={{
          title: project.title,
          year: project.year,
          uploaderName: project.uploaderName,
          universityName: project.universityName,
          departmentName: project.departmentName,
          url: currentUrl
        }}
      />
    </>
  );
}
