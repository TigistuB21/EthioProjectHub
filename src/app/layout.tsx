import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EthioProjectHub – Ethiopian University Final Year Project Repository',
  description:
    'Discover, upload, and manage final year university projects from Ethiopian universities. A centralized digital repository for students, advisors, and administrators.',
  keywords: 'Ethiopia, university, final year project, FYP, repository, research, academic',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
