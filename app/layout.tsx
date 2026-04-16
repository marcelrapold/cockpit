import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cockpit | Marcel Rapold',
  description:
    'Engineering-Dashboard: Live-Commits, Deployments, Uptime, Sprachen-Verteilung — GitHub, Vercel, Supabase.',
  metadataBase: new URL('https://cockpit.rapold.io'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
