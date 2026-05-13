// Trusted contacts for SOS. Stored in expo-secure-store so plaintext numbers
// never hit AsyncStorage. Max 3 contacts.
import * as SecureStore from 'expo-secure-store';

export type TrustedContact = {
  id: string;
  name: string;
  phone: string;
};

const KEY = 'saheli.contacts';
export const MAX_CONTACTS = 3;

export async function loadContacts(): Promise<TrustedContact[]> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as TrustedContact[];
    return Array.isArray(arr) ? arr.slice(0, MAX_CONTACTS) : [];
  } catch {
    return [];
  }
}

export async function saveContacts(list: TrustedContact[]): Promise<void> {
  const trimmed = list.slice(0, MAX_CONTACTS);
  await SecureStore.setItemAsync(KEY, JSON.stringify(trimmed));
}

export function newContactId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Light phone normalisation — strips spaces/hyphens but keeps + prefix.
export function normalisePhone(raw: string): string {
  return raw.replace(/[^\d+]/g, '');
}
