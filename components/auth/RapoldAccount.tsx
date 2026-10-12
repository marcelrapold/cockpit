'use client';

import type { DetailedHTMLProps, HTMLAttributes } from 'react';

import { LOGOUT_PATH } from '@/lib/auth/config';

type RapoldAccountAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  'logout-url'?: string;
  lang?: string;
};

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'rapold-account': RapoldAccountAttributes;
    }
  }
}

/**
 * Zentrales Kontomenü von auth.rapold.io (Avatar, Dienste, Konto & Sicherheit, Abmelden).
 * Das Element wird vom Script in app/layout.tsx definiert; «Abmelden» führt über
 * /api/auth/logout (Cockpit-Session löschen, dann SSO-Logout).
 */
export function RapoldAccount({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return <rapold-account logout-url={LOGOUT_PATH} lang="de" className="block h-11 shrink-0" />;
}
