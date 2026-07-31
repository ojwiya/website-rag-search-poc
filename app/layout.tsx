import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Property Search — RAG-Powered Real Estate',
  description: 'Search thousands of properties with natural language and improved UI/UX',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}