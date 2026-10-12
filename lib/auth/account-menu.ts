import { isOidcEnabled } from '@/lib/auth/config';
import { isPrivateMode } from '@/lib/security/exposure';

/** Script des zentralen Kontomenüs (definiert <rapold-account>). */
export const ACCOUNT_MENU_SCRIPT = 'https://auth.rapold.io/atlas/account.js';

/**
 * Nur serverseitig aufrufen: Das Kontomenü erscheint nur im privaten Modus mit Login über
 * auth.rapold.io. Mit Basic Auth gibt es keine SSO-Identität, die das Menü anzeigen könnte.
 */
export function isAccountMenuEnabled(): boolean {
  return isPrivateMode() && isOidcEnabled();
}
