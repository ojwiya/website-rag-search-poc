import type { Metadata } from 'next';
import './globals.css';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Homes in the Sun — Find your next home in Spain',
  description: 'Search thousands of verified overseas property listings with natural language.',
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
