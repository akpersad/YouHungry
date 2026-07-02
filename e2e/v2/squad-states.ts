import path from 'path';

/** Storage-state file for a signed-in squad member (written by the setup). */
export function storageStateFor(role: string): string {
  return path.join(__dirname, '../../playwright/.auth', `v2-${role}.json`);
}
