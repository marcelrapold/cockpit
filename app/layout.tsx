import type { Metadata } from 'next';
import './globals.css';

import { ACCOUNT_MENU_SCRIPT, isAccountMenuEnabled } from '@/lib/auth/account-menu';

export const metadata: Metadata = {
  title: 'Cockpit | Marcel Rapold',
  description:
    'Engineering-Dashboard: Live-Commits, Deployments, Uptime, Sprachen-Verteilung — GitHub, Vercel, Supabase.',
  metadataBase: new URL('https://cockpit.rapold.io'),
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Kontomenü von auth.rapold.io nur laden, wenn es angezeigt wird (privat + OIDC).
  const accountMenu = isAccountMenuEnabled();
  return (
    <html lang="de">
      {accountMenu ? (
        <head>
          <script type="module" src={ACCOUNT_MENU_SCRIPT} async />
        </head>
      ) : null}
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
