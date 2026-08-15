import type { Metadata } from 'next';
import './globals.css';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Homes in the Sun — Find your next home in the sun',
  description: 'Search overseas and holiday homes in plain English, then view the full listing on the source site.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-surface-alt text-heading">
        {children}
        <Footer />
      </body>
    </html>
  );
}
