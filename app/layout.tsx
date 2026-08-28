import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'THETRENDSETTA — Meta Comment-to-DM Engine',
  description: 'Automatically turn Instagram and Facebook comments into private DMs.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
